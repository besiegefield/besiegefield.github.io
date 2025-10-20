/**
 * 核心转换逻辑
 * 复现 utils.py 中的 JSON 到 XML 转换
 */

// 常量定义
const FLIP_SENSITIVE_BLOCKS = ["2", "46"];
const BLOCKPROPERTYPATH = "Besiege_blocks_markov.json";

/**
 * 从字符串中提取 JSON
 * 对应 utils.py 中的 extract_json_from_string
 */
function extractJSONFromString(inputString, returnRawStr = false) {
    if (Array.isArray(inputString)) {
        return returnRawStr ? [inputString, JSON.stringify(inputString)] : inputString;
    }

    let inputContent = inputString;

    // 尝试匹配 ```json ... ```
    const match = inputContent.match(/```json([\s\S]*?)```/);
    if (match) {
        const jsonContent = match[1].trim();
        try {
            const parsed = JSON.parse(jsonContent);
            return returnRawStr ? [parsed, jsonContent] : parsed;
        } catch (e) {
            // 继续尝试其他方法
        }
    }

    // 尝试直接解析
    try {
        const parsed = JSON.parse(inputContent);
        return returnRawStr ? [parsed, inputContent] : parsed;
    } catch (e) {
        if (returnRawStr) {
            return [null, ""];
        }
        return null;
    }
}

/**
 * 格式化 JSON
 * 对应 utils.py 中的 format_json
 */
function formatJSON(inputJSON) {
    try {
        const newCleanJSON = [];
        for (const jsonInfo of inputJSON) {
            const newCleanDict = {};
            const blockId = parseInt(jsonInfo["id"]);
            
            if (![7, 9].includes(blockId)) {
                newCleanDict["id"] = String(jsonInfo["id"]);
                newCleanDict["order_id"] = parseInt(jsonInfo["order_id"]);
                newCleanDict["parent"] = parseInt(jsonInfo["parent"]);
                newCleanDict["bp_id"] = parseInt(jsonInfo["bp_id"]);
            } else {
                newCleanDict["id"] = String(jsonInfo["id"]);
                newCleanDict["order_id"] = parseInt(jsonInfo["order_id"]);
                newCleanDict["parent_a"] = parseInt(jsonInfo["parent_a"]);
                newCleanDict["bp_id_a"] = parseInt(jsonInfo["bp_id_a"]);
                newCleanDict["parent_b"] = parseInt(jsonInfo["parent_b"]);
                newCleanDict["bp_id_b"] = parseInt(jsonInfo["bp_id_b"]);
            }
            newCleanJSON.push(newCleanDict);
        }
        return newCleanJSON;
    } catch (error) {
        return inputJSON;
    }
}

/**
 * 转换为 numpy 风格的数组
 * 对应 utils.py 中的 convert_to_numpy
 */
function convertToNumpy(data) {
    let noGlobalrt = true;
    
    for (const info of data) {
        if ("GlobalPosition" in info) {
            noGlobalrt = false;
            break;
        }
    }

    if (noGlobalrt) {
        const newData = [{
            "GlobalPosition": [0, 5.05, 0],
            "GlobalRotation": [0, 0, 0, 1]
        }];
        return newData.concat(data);
    }

    return data;
}

/**
 * 从 LLM 获取 3D 信息
 * 对应 utils.py 中的 get_3d_from_llm
 */
function get3DFromLLM(blockSizes, inputInfo, gp, gr, log = false) {
    const info = JSON.parse(JSON.stringify(inputInfo)); // deep copy
    
    // 调试：检查 blockSizes 是否为空
    console.log('🔍 get3DFromLLM 调用 - blockSizes 键:', Object.keys(blockSizes).slice(0, 10));
    console.log('🔍 get3DFromLLM 调用 - inputInfo 长度:', inputInfo.length);
    console.log('🔍 get3DFromLLM 调用 - gp:', gp);
    console.log('🔍 get3DFromLLM 调用 - gr:', gr);
    
    if (!blockSizes || Object.keys(blockSizes).length === 0) {
        throw new Error('❌ 方块数据(blockSizes)未加载或为空！请刷新页面重试。');
    }
    
    // 检查全局参数
    if (!Array.isArray(gp) || gp.length !== 3 || gp.some(v => typeof v !== 'number')) {
        throw new Error(`❌ GlobalPosition (gp) 格式错误！应为 [x, y, z]\n当前值: ${JSON.stringify(gp)}`);
    }
    // gr 可以是四元数 [x,y,z,w] 或 3x3 旋转矩阵
    const isQuaternion = Array.isArray(gr) && gr.length === 4 && gr.every(v => typeof v === 'number');
    const isMatrix = Array.isArray(gr) && gr.length === 3 && gr.every(row => Array.isArray(row) && row.length === 3);
    if (!isQuaternion && !isMatrix) {
        throw new Error(`❌ GlobalRotation (gr) 格式错误！应为四元数 [x, y, z, w] 或 3x3 矩阵\n当前值: ${JSON.stringify(gr)}`);
    }

    for (const block of info) {
        try {
            const orderId = parseInt(block["order_id"]);
            const blockId = String(block["id"]);
            
            console.log(`\n🔍 开始处理方块 ${orderId} (ID: ${blockId})`);

        // Handle scale (存储为数组 [1, 1, 1]，不改变块的 scale)
        if (!("scale" in block)) {
            block["scale"] = [1, 1, 1];
        } else {
            console.warn(`警告！${orderId}改变了scale！使用初始值`);
            block["scale"] = [1, 1, 1];
        }

        // Handle rotations
        if (!("bp_lr" in block)) {
            if (!("manu_lr" in block)) {
                block["bp_lr"] = [0, 0, 0, 1];
            } else if ("manu_lr" in block && String(block["parent"] || "") !== "-1") {
                console.warn(`警告！${orderId}有manu_lr但不是根节点！旋转使用初始值`);
                block["bp_lr"] = [0, 0, 0, 1];
                delete block["manu_lr"];
            }
        }

        const blockInfo = blockSizes[blockId];
        
        console.log(`  - blockInfo 存在:`, !!blockInfo);
        if (blockInfo) {
            console.log(`  - bc_bp 数量:`, blockInfo.bc_bp ? blockInfo.bc_bp.length : 'undefined');
            console.log(`  - bc_gc:`, blockInfo.bc_gc);
            console.log(`  - bbox_size:`, blockInfo.bbox_size);
        }
        
        // 检查方块信息是否存在
        if (!blockInfo) {
            throw new Error(`方块 ID ${blockId} (order_id: ${orderId}) 在方块数据中不存在！\n可用的方块 ID: ${Object.keys(blockSizes).join(', ')}`);
        }
        
        // 使用正确的方式获取 parent（可能为 0）
        const parent = "parent" in block ? parseInt(block["parent"]) : -1;
        console.log(`  - parent 字段: ${block["parent"]}, 解析后: ${parent}`);

        // Handle parent cases
        if (parent === -1) {
            if (!["0", "7", "9"].includes(blockId)) {
                console.warn("警告！发现了非起始方块的无父节点块");
            }

            if (["7", "9"].includes(blockId)) {
                const parentA = parseInt(block["parent_a"]);
                const parentB = parseInt(block["parent_b"]);
                const bpIdA = parseInt(block["bp_id_a"]);
                const bpIdB = parseInt(block["bp_id_b"]);
                
                block["bp_lr"] = [0, 0, 0, 1];
                block["manu_lr"] = addRotations(
                    info[parentA]["my_building_points_buildrotation"][bpIdA],
                    block["bp_lr"]
                );
                block["manu_lp_a"] = Vector.subtract(
                    info[parentA]["my_building_points"][bpIdA],
                    gp
                );
                block["manu_lp_b"] = Vector.subtract(
                    info[parentB]["my_building_points"][bpIdB],
                    gp
                );
            } else {
                if (!("manu_lr" in block)) {
                    block["manu_lr"] = [0, 0, 0, 1];
                    block["manu_lp"] = [0, 0, 0];
                } else {
                    console.warn("警告！发现了某个方块的manu_lr和manu_lp");
                    if (!Array.isArray(block["manu_lr"]) || block["manu_lr"].length !== 4) {
                        block["manu_lr"] = Rotation.from_matrix(block["manu_lr"]).as_quat();
                    }
                }
            }
        } else {
            try {
                // 使用正确的方式获取 bp_id（可能为 0）
                const bpId = "bp_id" in block ? parseInt(block["bp_id"]) : -1;
                console.log(`  - bp_id 字段: ${block["bp_id"]}, 解析后: ${bpId}`);
                
                // 检查 bp_id 是否有效
                if (bpId === -1 || isNaN(bpId)) {
                    throw new Error(`方块 ${orderId} 缺少有效的 bp_id 字段！`);
                }
                
                // 详细检查父块数据
                if (!info[parent]) {
                    throw new Error(`父块 ${parent} 不存在！当前处理 order_id: ${orderId}`);
                }
                if (!info[parent]["my_building_points"]) {
                    throw new Error(`父块 ${parent} 缺少 my_building_points！这可能是因为父块还未被处理。`);
                }
                if (!info[parent]["my_building_points_buildrotation"]) {
                    throw new Error(`父块 ${parent} 缺少 my_building_points_buildrotation！`);
                }
                if (bpId < 0 || bpId >= info[parent]["my_building_points"].length) {
                    throw new Error(`建造点 ID ${bpId} 超出范围！父块 ${parent} 只有 ${info[parent]["my_building_points"].length} 个建造点。`);
                }
                
                const buildPointLocalRot = info[parent]["my_building_points_buildrotation"][bpId];  // 建造点的局部朝向
                const parentPoint = info[parent]["my_building_points"][bpId];
                
                // 检查数据有效性
                if (!Array.isArray(buildPointLocalRot) || buildPointLocalRot.length !== 4) {
                    throw new Error(`父块建造点旋转数据格式错误: ${JSON.stringify(buildPointLocalRot)}`);
                }
                if (!Array.isArray(parentPoint) || parentPoint.length !== 3) {
                    throw new Error(`父块建造点位置数据格式错误: ${JSON.stringify(parentPoint)}`);
                }
                if (!Array.isArray(block["bp_lr"]) || block["bp_lr"].length !== 4) {
                    throw new Error(`方块 bp_lr 数据格式错误: ${JSON.stringify(block["bp_lr"])}`);
                }
                
                // 直接使用建造点旋转（与 Python 代码一致）
                console.log(`  - 建造点旋转 (parent_rot): [${buildPointLocalRot.join(', ')}]`);
                console.log(`  - 子块相对旋转 (bp_lr): [${block["bp_lr"].join(', ')}]`);
                
                // Python: block["manu_lr"] = add_rotations(parent_rot, block["bp_lr"])
                block["manu_lr"] = addRotations(buildPointLocalRot, block["bp_lr"]);
                block["manu_lp"] = Vector.subtract(parentPoint, gp);
                
                console.log(`  - 计算结果: manu_lr = [${block["manu_lr"].join(', ')}]`);
                console.log(`  - 计算结果: manu_lp = [${block["manu_lp"].join(', ')}]`);
                
                // 验证结果
                if (block["manu_lp"].some(v => isNaN(v))) {
                    throw new Error(`计算出的 manu_lp 包含 NaN！parentPoint: ${JSON.stringify(parentPoint)}, gp: ${JSON.stringify(gp)}`);
                }
                if (block["manu_lr"].some(v => isNaN(v))) {
                    throw new Error(`计算出的 manu_lr 包含 NaN！parentRot: ${JSON.stringify(parentRot)}, bp_lr: ${JSON.stringify(block["bp_lr"])}`);
                }
                
            } catch (error) {
                throw new Error(`处理方块 ${orderId} 的父子关系时出错: ${error.message}`);
            }
        }

        if (!["7", "9"].includes(blockId)) {
            if (FLIP_SENSITIVE_BLOCKS.includes(blockId)) {
                block["flip"] = areQuaternionsSimilar(block["manu_lr"]);
            }

            let bcBp = blockInfo['bc_bp'];
            let bcGc = blockInfo['bc_gc'];
            let bboxSize = blockInfo['bbox_size'];
            
            // 详细的参数验证
            if (!Array.isArray(bcBp)) {
                throw new Error(`方块 ${blockId} (order_id: ${orderId}) 的 bc_bp 不是数组！\nblockInfo: ${JSON.stringify(blockInfo)}`);
            }
            if (!Array.isArray(bcGc) || bcGc.length !== 3) {
                throw new Error(`方块 ${blockId} (order_id: ${orderId}) 的 bc_gc 格式错误！\nbc_gc: ${JSON.stringify(bcGc)}`);
            }
            if (!Array.isArray(bboxSize) || bboxSize.length !== 3) {
                throw new Error(`方块 ${blockId} (order_id: ${orderId}) 的 bbox_size 格式错误！\nbbox_size: ${JSON.stringify(bboxSize)}`);
            }
            if (!Array.isArray(block["manu_lp"]) || block["manu_lp"].length !== 3) {
                throw new Error(`方块 ${blockId} (order_id: ${orderId}) 的 manu_lp 格式错误！\nmanu_lp: ${JSON.stringify(block["manu_lp"])}`);
            }
            if (!Array.isArray(block["manu_lr"]) || block["manu_lr"].length !== 4) {
                throw new Error(`方块 ${blockId} (order_id: ${orderId}) 的 manu_lr 格式错误！\nmanu_lr: ${JSON.stringify(block["manu_lr"])}`);
            }

            if (blockId === "30") {
                bcGc = [0, 0, 0.5];
                bboxSize = [1, 1, 1];
            }
            
            console.log(`  - 调用 getMyBuildingPoints 参数:`);
            console.log(`    manu_lp: [${block["manu_lp"].join(', ')}]`);
            console.log(`    manu_lr: [${block["manu_lr"].join(', ')}]`);
            console.log(`    bcGc: [${bcGc.join(', ')}]`);
            console.log(`    bboxSize: [${bboxSize.join(', ')}]`);
            console.log(`    gp: [${gp.join(', ')}]`);
            console.log(`    gr: [${gr.join(', ')}]`);

            let myBuildingPoints, myBuildingPointsBuildrotation;
            try {
                console.log(`  ⚙️ 开始调用 getMyBuildingPoints (方块 ${orderId})...`);
                // 将 scale 数组转换为标量（取第一个值，通常是 1）
                const scaleValue = Array.isArray(block["scale"]) ? block["scale"][0] : block["scale"];
                const result = getMyBuildingPoints(
                    bcBp,
                    block["manu_lp"],
                    block["manu_lr"],
                    gp,
                    gr,
                    bcGc,
                    bboxSize,
                    scaleValue
                );
                myBuildingPoints = result.myBuildingPoints;
                myBuildingPointsBuildrotation = result.myBuildingPointsBuildrotation;
                console.log(`  ✅ getMyBuildingPoints 调用成功 (方块 ${orderId})`);
            } catch (error) {
                console.error(`  ❌ getMyBuildingPoints 调用失败 (方块 ${orderId}):`, error);
                throw new Error(`方块 ${orderId} 调用 getMyBuildingPoints 失败: ${error.message}`);
            }
            
            console.log(`  - getMyBuildingPoints 返回:`);
            console.log(`    myBuildingPoints[0]:`, myBuildingPoints[0]);
            console.log(`    myBuildingPointsBuildrotation[0]:`, myBuildingPointsBuildrotation[0]);

            block["my_building_points"] = myBuildingPoints;
            block["my_building_points_buildrotation"] = myBuildingPointsBuildrotation;

            if (log) {
                console.log(`block_id:${blockId}\nscale:${block['scale']}\nbc_gc:${bcGc}\n` +
                          `bbox_size:${bboxSize}\nmanu_lp:${block['manu_lp']}\n` +
                          `manu_lr:${block['manu_lr']}\nmy_building_points:${myBuildingPoints}\n` +
                          `my_building_points_buildrotation:${myBuildingPointsBuildrotation}`);
            }
            
            console.log(`✅ 方块 ${orderId} 处理完成\n`);
        }
        
        } catch (error) {
            console.error(`❌ 处理方块 ${orderId || block["order_id"]} 时出错:`, error);
            throw error;
        }
    }

    return info;
}

/**
 * LLM JSON 转 XML 文件树
 * 对应 utils.py 中的 llm2xml_filetree
 */
async function llm2xmlFiletree(blockDetails, blockSizes, selectedMenu = null) {
    const globalRt = blockDetails.shift();
    const gp = globalRt["GlobalPosition"];
    const grQuat = globalRt["GlobalRotation"];
    
    if (!gp || !Array.isArray(gp) || gp.length !== 3) {
        throw new Error(`❌ GlobalPosition 缺失或格式错误！\nglobalRt: ${JSON.stringify(globalRt)}`);
    }
    if (!grQuat || !Array.isArray(grQuat) || grQuat.length !== 4) {
        throw new Error(`❌ GlobalRotation 缺失或格式错误！\nglobalRt: ${JSON.stringify(globalRt)}`);
    }

    const blocksToDelete = new Set();
    const blocksToDeleteFeedback = [];

    console.log('🔍 llm2xmlFiletree - blockDetails 初始长度:', blockDetails.length);
    console.log('🔍 llm2xmlFiletree - blockDetails:', blockDetails);
    
    // 整体格式检查
    const linear = new Set(["id", "order_id", "parent_a", "bp_id_a", "parent_b", "bp_id_b"]);
    const nonLinear = new Set(["id", "order_id", "parent", "bp_id"]);

    for (let i = 0; i < blockDetails.length; i++) {
        const block = blockDetails[i];
        const blockKeys = new Set(Object.keys(block));
        const isLinear = [...linear].every(k => blockKeys.has(k));
        const isNonLinear = [...nonLinear].every(k => blockKeys.has(k));

        const checkResult = {
            index: i,
            order_id: block.order_id,
            id: block.id,
            isLinear,
            isNonLinear,
            keys: Object.keys(block)
        };
        console.log(`🔍 检查方块 ${i} (order_id: ${block.order_id}, id: ${block.id}):`, checkResult);

        if (!isLinear && !isNonLinear) {
            blocksToDelete.add(block.order_id);  // 使用 order_id 而不是索引 i
            blocksToDeleteFeedback.push(`警告：块(orderID ${block.order_id})结构非法，缺少必需字段`);
            console.log(`⚠️ 方块 order_id ${block.order_id} (索引 ${i}) 被标记删除: 结构非法`);
            console.log(`   需要字段: ${[...nonLinear].join(', ')}`);
            console.log(`   实际字段: ${Object.keys(block).join(', ')}`);
        }
    }

    const orderIdMap = {};
    for (const b of blockDetails) {
        orderIdMap[parseInt(b["order_id"])] = b;
    }

    for (let i = 0; i < blockDetails.length; i++) {
        const block = blockDetails[i];
        let isLinear = false;

        // 检查起始方块
        if (i === 0) {
            const blockType = String(block["id"]);
            const orderId = parseInt(block["order_id"]);
            // 使用正确的方式获取可能为 0 的值
            const parentOrder = "parent" in block ? parseInt(block["parent"]) : -2;
            const bpId = "bp_id" in block ? parseInt(block["bp_id"]) : -2;

            if (blockType !== "0" || orderId !== 0) {
                blocksToDelete.add(orderId);  // 使用 order_id
                blocksToDeleteFeedback.push(`警告：起始方块非法`);
                continue;
            }
            if (parentOrder !== -1 || bpId !== -1) {
                block["parent"] = -1;
                block["bp_id"] = -1;
            }
        }

        const orderId = parseInt(block["order_id"]);
        // 使用 ?? 而不是 ||，因为 parent 可能是 0（0 是有效值但在 || 中是 falsy）
        const parentOrder = "parent" in block ? parseInt(block["parent"]) : -1;
        
        console.log(`  🔍 方块 ${orderId}: parent=${block["parent"]}, parentOrder=${parentOrder}`);
        
        let parents;
        if (parentOrder === -1 && orderId !== 0) {
            isLinear = true;
            // parent_a 和 parent_b 也可能是 0
            const parentOrderA = "parent_a" in block ? parseInt(block["parent_a"]) : -1;
            const parentOrderB = "parent_b" in block ? parseInt(block["parent_b"]) : -1;
            parents = [parentOrderA, parentOrderB];
            console.log(`  🔍 线性块: parent_a=${parentOrderA}, parent_b=${parentOrderB}`);
        } else {
            parents = [parentOrder];
        }

        // 检查1: 父块是否已被标记为非法
        if (parents.some(order => blocksToDelete.has(order))) {
            blocksToDelete.add(orderId);
            blocksToDeleteFeedback.push(`警告：块(orderID ${orderId})的父块非法`);
            continue;
        }

        // 检查2: 父块的建造点是否有效
        for (let j = 0; j < parents.length; j++) {
            const parentOrder = parents[j];
            const parentBlock = orderIdMap[parentOrder];
            
            if (parentBlock) {
                const parentBlockId = String(parentBlock["id"]);
                let bpId;
                
                if (j === 0) {
                    // bp_id 可能是 0，所以不能用 ||
                    if ("bp_id" in block) {
                        bpId = parseInt(block["bp_id"]);
                    } else if ("bp_id_a" in block) {
                        bpId = parseInt(block["bp_id_a"]);
                    } else {
                        bpId = -1;
                    }
                } else if (j === 1) {
                    bpId = "bp_id_b" in block ? parseInt(block["bp_id_b"]) : -1;
                } else {
                    bpId = -1;
                }

                if (blockSizes[parentBlockId]) {
                    const availableBps = blockSizes[parentBlockId]["bc_bp"].length;
                    if (bpId < 0 || bpId >= availableBps) {
                        blocksToDelete.add(orderId);
                        blocksToDeleteFeedback.push(
                            `警告：块(orderID ${orderId})的父块(ID ${parentBlockId})不存在可建造点${bpId}（有效范围:0-${availableBps-1}）`
                        );
                        continue;
                    }
                }
            }
        }

        // 检查3: 双父块（线性块）的特殊处理
        if (!isLinear && ["7", "9"].includes(String(block["id"]))) {
            blocksToDelete.add(orderId);
            blocksToDeleteFeedback.push(`警告：块(orderID ${orderId})是线性块但不存在双parent属性`);
            continue;
        } else if (isLinear && !["7", "9"].includes(String(block["id"]))) {
            blocksToDelete.add(orderId);
            blocksToDeleteFeedback.push(`警告：块(orderID ${orderId})存在双parent属性但不是线性块`);
            continue;
        }
    }

    // 过滤掉要删除的块
    console.log('🔍 blocksToDelete (数组内容):', Array.from(blocksToDelete));
    console.log('🔍 blocksToDeleteFeedback (详细原因):');
    blocksToDeleteFeedback.forEach(msg => console.log('  ⚠️', msg));
    
    if (blocksToDelete.size > 0) {
        console.log(`⚠️ 过滤前方块数量: ${blockDetails.length}`);
        blockDetails = blockDetails.filter(b => !blocksToDelete.has(parseInt(b["order_id"])));
        console.log(`⚠️ 过滤后方块数量: ${blockDetails.length}`);
    }

    // 计算 3D 位置并构建 XML 风格列表
    console.log('🔍 调用 get3DFromLLM，blockDetails 长度:', blockDetails.length);
    const processedDetails = get3DFromLLM(blockSizes, blockDetails, gp, grQuat, false);
    
    const xmlBlockDetails = [{ "GlobalPosition": gp, "GlobalRotation": grQuat }];
    
    for (const block of processedDetails) {
        const xmlInfo = {
            "id": block["id"],
            "order_id": block["order_id"],
            "guid": generateGUID()
        };

        if (["7", "9"].includes(String(block["id"]))) {
            // 线性块
            xmlInfo["Transform"] = {
                "Position": block["manu_lp_a"],
                "Rotation": [0, 0, 0, 1],
                "Scale": block["scale"]
            };
            xmlInfo["end-position"] = Vector.subtract(block["manu_lp_b"], block["manu_lp_a"]);
        } else {
            // 普通块
            let manuLr = block["manu_lr"];
            if (Matrix.is3x3(manuLr)) {
                manuLr = Rotation.from_matrix(manuLr).as_quat();
            }
            
            xmlInfo["Transform"] = {
                "Position": block["manu_lp"],
                "Rotation": manuLr,
                "Scale": block["scale"]
            };

            if ("flip" in block) {
                xmlInfo["flip"] = block["flip"];
                xmlInfo["auto"] = true;
                xmlInfo["autobrake"] = false;
                if (selectedMenu && "special_props" in selectedMenu) {
                    xmlInfo["WheelDoubleSpeed"] = selectedMenu["special_props"].includes("WheelDoubleSpeed");
                }
            }
        }

        xmlBlockDetails.push(xmlInfo);
    }

    return {
        xmlBlockDetails,
        processedDetails,
        feedback: blocksToDeleteFeedback.join("\n")
    };
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractJSONFromString,
        formatJSON,
        convertToNumpy,
        get3DFromLLM,
        llm2xmlFiletree
    };
}

