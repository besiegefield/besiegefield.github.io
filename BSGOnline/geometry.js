/**
 * 几何计算模块
 * 复现 utils.py 中的几何相关函数
 */

// 导入依赖
// 注意：在HTML中需要按正确顺序加载这些脚本

/**
 * 生成唯一的 GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 计算两个向量之间的旋转四元数
 * 对应 utils.py 中的 rotation_quaternion
 */
function rotationQuaternion(vFrom, vTo) {
    // 归一化向量
    const from = Vector.normalize(vFrom);
    const to = Vector.normalize(vTo);

    // 计算旋转轴和角度
    const cross = Vector.cross(from, to);
    const dot = Vector.dot(from, to);

    // 无需旋转
    if (Vector.allclose(cross, [0, 0, 0]) && Math.abs(dot - 1) < 1e-10) {
        return [0, 0, 0, 1];
    }

    // 反向
    if (Vector.allclose(cross, [0, 0, 0]) && Math.abs(dot + 1) < 1e-10) {
        // 选择一个垂直轴
        let axis;
        if (Math.abs(from[0]) < 1e-10 && Math.abs(from[1]) < 1e-10) {
            axis = [0, 1, 0];
        } else {
            axis = Vector.cross(from, [0, 1, 0]);
        }
        axis = Vector.normalize(axis);
        const angle = Math.PI;
        return Rotation.from_rotvec(Vector.scale(axis, angle)).as_quat();
    }

    // 正常情况
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    const axis = Vector.normalize(cross);
    return Rotation.from_rotvec(Vector.scale(axis, angle)).as_quat();
}

/**
 * 叠加两个旋转四元数
 * 对应 utils.py 中的 add_rotations
 */
function addRotations(q1, q2) {
    const r1 = Rotation.from_quat(q1);
    const r2 = Rotation.from_quat(q2);
    const rCombined = r1.multiply(r2);
    return rCombined.as_quat();
}

/**
 * 获取相对位置列表
 * 对应 utils.py 中的 get_relative_pos_list
 */
function getRelativePosList(bpOldpos, refP, refR, scale = 1, decimals = null) {
    const bpNewpos = [];

    // 确保 refR 是旋转矩阵
    let rotMatrix = refR;
    if (!Matrix.is3x3(refR)) {
        // 如果是四元数，转换为旋转矩阵
        rotMatrix = Rotation.from_quat(refR).as_matrix();
    }

    for (const point of bpOldpos) {
        // point_lp = ref_p + np.dot(ref_r, point * scale)
        const scaledPoint = Vector.scale(point, scale);
        const rotatedPoint = Matrix.multiplyVector(rotMatrix, scaledPoint);
        const pointLp = Vector.add(refP, rotatedPoint);
        bpNewpos.push(pointLp);
    }

    if (decimals !== null) {
        return ArrayUtils.round(bpNewpos, decimals);
    }

    return bpNewpos;
}

/**
 * 获取包围盒
 * 对应 utils.py 中的 get_bbox
 */
function getBbox(manuLp, manuLr, scale, bcGc, bboxSize, gp, gr) {
    // 确保旋转都是矩阵形式
    let manuLrMatrix = Matrix.is3x3(manuLr) ? manuLr : Rotation.from_quat(manuLr).as_matrix();
    let grMatrix = Matrix.is3x3(gr) ? gr : Rotation.from_quat(gr).as_matrix();

    const halfBboxSize = bboxSize.map(s => s / 2.0);
    const bboxLp = [];

    // 生成8个顶点
    for (const z of [-1, 1]) {
        for (const x of [-1, 1]) {
            for (const y of [-1, 1]) {
                // point = (manu_lp+bc_gc) + (x * half_bbox_size[0], y * half_bbox_size[1], z * half_bbox_size[2])
                const offset = [
                    x * halfBboxSize[0],
                    y * halfBboxSize[1],
                    z * halfBboxSize[2]
                ];
                const point = Vector.add(Vector.add(manuLp, bcGc), offset);
                // bc_point = point - manu_lp
                const bcPoint = Vector.subtract(point, manuLp);
                // point_lp = manu_lp + np.dot(manu_lr, bc_point * scale)
                const scaledBcPoint = Vector.scale(bcPoint, scale);
                const rotatedBcPoint = Matrix.multiplyVector(manuLrMatrix, scaledBcPoint);
                const pointLp = Vector.add(manuLp, rotatedBcPoint);
                bboxLp.push(pointLp);
            }
        }
    }

    // bbox_gp = get_relative_pos_list(bbox_lp, gp, gr, decimals=2)
    const bboxGp = getRelativePosList(bboxLp, gp, grMatrix, 1, 2);

    return { bboxLp, bboxGp };
}

/**
 * 计算法向量
 * 对应 utils.py 中的 compute_normal_vector
 */
function computeNormalVector(vertices, bp) {
    const bpRounded = ArrayUtils.round(bp, 3);

    // 计算每个维度的最小和最大坐标
    const minCoords = ArrayUtils.minAxis(vertices, 0);
    const maxCoords = ArrayUtils.maxAxis(vertices, 0);

    const epsilon = 0.01;  // 缩小容差，避免误判

    // 检查点在哪个面上
    // X方向
    if (Math.abs(bpRounded[0] - minCoords[0]) < epsilon) {
        return [-1, 0, 0];  // 左面
    }
    if (Math.abs(bpRounded[0] - maxCoords[0]) < epsilon) {
        return [1, 0, 0];   // 右面
    }
    // Y方向
    if (Math.abs(bpRounded[1] - minCoords[1]) < epsilon) {
        return [0, -1, 0];  // 下面
    }
    if (Math.abs(bpRounded[1] - maxCoords[1]) < epsilon) {
        return [0, 1, 0];   // 上面
    }
    // Z方向
    if (Math.abs(bpRounded[2] - minCoords[2]) < epsilon) {
        return [0, 0, -1];  // 后面
    }
    if (Math.abs(bpRounded[2] - maxCoords[2]) < epsilon) {
        return [0, 0, 1];   // 前面
    }

    // 添加详细的调试信息
    const distances = [
        `X轴: min=${minCoords[0].toFixed(2)}, max=${maxCoords[0].toFixed(2)}, bp=${bpRounded[0].toFixed(2)}`,
        `Y轴: min=${minCoords[1].toFixed(2)}, max=${maxCoords[1].toFixed(2)}, bp=${bpRounded[1].toFixed(2)}`,
        `Z轴: min=${minCoords[2].toFixed(2)}, max=${maxCoords[2].toFixed(2)}, bp=${bpRounded[2].toFixed(2)}`
    ];
    throw new Error(`点不在长方体的任何一个面上 (epsilon=${epsilon})\n建造点: [${bpRounded.join(', ')}]\n包围盒范围:\n${distances.join('\n')}`);
}

/**
 * 获取建造点信息
 * 对应 utils.py 中的 get_mybuildingpoints
 */
function getMyBuildingPoints(bcBp, manuLp, manuLr, gp, gr, bcGc, bboxSize, scale = 1) {
    console.log(`    [getMyBuildingPoints] 输入参数:`);
    console.log(`      bcBp 数量: ${bcBp.length}${bcBp.length > 0 ? `, 第一个: [${bcBp[0].join(', ')}]` : ' (空数组)'}`);
    console.log(`      manuLp: [${manuLp.join(', ')}]`);
    console.log(`      manuLr: [${manuLr.join(', ')}]`);
    console.log(`      scale: ${scale}`);
    
    const bpOri = bcBp;
    const bpLp = getRelativePosList(bpOri, manuLp, manuLr, scale);
    console.log(`    [getMyBuildingPoints] bpLp 计算完成, 数量: ${bpLp.length}`);
    if (bpLp.length > 0) {
        console.log(`      bpLp[0]: [${bpLp[0].join(', ')}]`);
    }
    
    let grMatrix = Matrix.is3x3(gr) ? gr : Rotation.from_quat(gr).as_matrix();
    const bpGp = getRelativePosList(bpLp, gp, grMatrix, 1, 2);
    console.log(`    [getMyBuildingPoints] bpGp 计算完成`);
    
    const { bboxLp, bboxGp } = getBbox(manuLp, manuLr, scale, bcGc, bboxSize, gp, gr);
    console.log(`    [getMyBuildingPoints] bboxLp 计算完成, 数量: ${bboxLp.length}`);
    if (bboxLp.length > 0) {
        console.log(`      bboxLp[0]: [${bboxLp[0].join(', ')}]`);
    }

    const myBuildingPoints = bpGp;
    const myBuildingPointsBuildrotation = [];

    for (let i = 0; i < myBuildingPoints.length; i++) {
        console.log(`    [getMyBuildingPoints] 循环 ${i}: bpLp[${i}] = [${bpLp[i].join(', ')}]`);
        const normalVectorL = computeNormalVector(bboxLp, bpLp[i]);
        console.log(`      normalVectorL: [${normalVectorL.join(', ')}]`);
        const rotatedInitvec = [0, 0, 1];
        // 保持与Python一致：从 rotatedInitvec 到 normalVectorL
        const buildingPointsRotQuat = rotationQuaternion(rotatedInitvec, normalVectorL);
        console.log(`      buildingPointsRotQuat: [${buildingPointsRotQuat.join(', ')}]`);
        myBuildingPointsBuildrotation.push(buildingPointsRotQuat);
    }

    return {
        myBuildingPoints,
        myBuildingPointsBuildrotation
    };
}

/**
 * 判断四元数是否相似
 * 对应 utils.py 中的 are_quaternions_similar
 */
function areQuaternionsSimilar(q1, angleThreshold = 1e-3) {
    const q2 = [0, -0.7071068, 0, 0.7071068];
    
    const r1 = Rotation.from_quat(q1);
    const r2 = Rotation.from_quat(q2);
    
    const relativeRotation = r1.inv().multiply(r2);
    const angle = relativeRotation.magnitude();
    
    return angle < angleThreshold;
}

/**
 * 判断朝向
 * 对应 utils.py 中的 facing
 */
function facing(qIn) {
    const angleThreshold = 1e-3;
    const rots = [
        [0, 0, 0, 1],        // z+
        [0, 1, 0, 0],        // z-
        [0, -0.7071068, 0, 0.7071068],  // x-
        [0, 0.7071068, 0, 0.7071068],   // x+
        [-0.7071068, 0, 0, 0.7071068],  // y+
        [0.7071068, 0, 0, 0.7071068]    // y-
    ];
    const facingNames = ["z+", "z-", "x-", "x+", "y+", "y-"];

    const r1 = Rotation.from_quat(qIn);

    for (let i = 0; i < rots.length; i++) {
        const r2 = Rotation.from_quat(rots[i]);
        const relativeRotation = r1.inv().multiply(r2);
        const angle = relativeRotation.magnitude();

        if (angle < angleThreshold) {
            return facingNames[i];
        }
    }

    return "Error!未找到正确方向";
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateGUID,
        rotationQuaternion,
        addRotations,
        getRelativePosList,
        getBbox,
        computeNormalVector,
        getMyBuildingPoints,
        areQuaternionsSimilar,
        facing
    };
}

