/**
 * XML 生成器
 * 对应 utils.py 中的 create_xml
 */

/**
 * 创建 XML
 * 对应 utils.py 中的 create_xml
 */
function createXML(data) {
    // 复制数据，避免修改原数据
    const dataCopy = JSON.parse(JSON.stringify(data));
    
    // 提取 Global 信息
    const globalInfos = dataCopy.shift();
    const gp = globalInfos["GlobalPosition"];
    const gr = globalInfos["GlobalRotation"];

    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<Machine version="1" bsgVersion="1.3" name="gpt">\n';
    
    // Global 元素
    xml += '  <Global>\n';
    xml += `    <Position x="${gp[0]}" y="${gp[1]}" z="${gp[2]}" />\n`;
    xml += `    <Rotation x="${gr[0]}" y="${gr[1]}" z="${gr[2]}" w="${gr[3]}" />\n`;
    xml += '  </Global>\n';
    
    // Data 元素
    xml += '  <Data>\n';
    xml += '    <StringArray key="requiredMods" />\n';
    xml += '  </Data>\n';
    
    // Blocks 元素
    xml += '  <Blocks>\n';

    // 遍历每个方块
    for (const info of dataCopy) {
        let blockId = info['id'];
        
        if (info['id'] === '18_1') {
            blockId = '18';
        }

        xml += `    <Block id="${blockId}" guid="${info['guid']}">\n`;
        xml += '      <Transform>\n';
        
        const infoP = info['Transform']['Position'];
        xml += `        <Position x="${infoP[0]}" y="${infoP[1]}" z="${infoP[2]}" />\n`;
        
        const infoR = info['Transform']['Rotation'];
        xml += `        <Rotation x="${infoR[0]}" y="${infoR[1]}" z="${infoR[2]}" w="${infoR[3]}" />\n`;
        
        const infoS = info['Transform']['Scale'];
        xml += `        <Scale x="${infoS[0]}" y="${infoS[1]}" z="${infoS[2]}" />\n`;
        
        xml += '      </Transform>\n';
        xml += '      <Data>\n';

        // 起始方块特殊处理
        if (String(info['id']) === "0") {
            xml += '        <Integer key="bmt-version">1</Integer>\n';
        }

        // 活塞特殊处理
        if (String(info['id']) === "9") {
            xml += '        <Single key="bmt-slider">10</Single>\n';
            xml += '        <StringArray key="bmt-contract">L</StringArray>\n';
            xml += '        <Boolean key="bmt-toggle">False</Boolean>\n';
        }

        // 线性块设置坐标
        if (String(info['id']) === "7" || String(info['id']) === "9") {
            xml += '        <Vector3 key="start-position">\n';
            xml += '          <X>0</X>\n';
            xml += '          <Y>0</Y>\n';
            xml += '          <Z>0</Z>\n';
            xml += '        </Vector3>\n';
            xml += '        <Vector3 key="end-position">\n';
            xml += `          <X>${info['end-position'][0]}</X>\n`;
            xml += `          <Y>${info['end-position'][1]}</Y>\n`;
            xml += `          <Z>${info['end-position'][2]}</Z>\n`;
            xml += '        </Vector3>\n';
        }

        // 转向轴承特殊处理
        if (String(info['id']) === "22") {
            xml += '        <Integer key="bmt-version">1</Integer>\n';
            xml += '        <Single key="bmt-speed">1</Single>\n';
            xml += '        <Single key="bmt-acceleration">Infinity</Single>\n';
            xml += '        <Boolean key="bmt-auto-brake">True</Boolean>\n';
            xml += '        <Boolean key="flipped">False</Boolean>\n';
        }

        // 配重块特殊处理
        if (String(info['id']) === "35") {
            xml += '        <Single key="bmt-mass">3</Single>\n';
        }

        // 轮子镜像处理
        if ("auto" in info) {
            xml += '        <Boolean key="bmt-automatic">True</Boolean>\n';
            xml += '        <Boolean key="bmt-auto-brake">False</Boolean>\n';
        }
        if ("flip" in info && info["flip"]) {
            xml += '        <Boolean key="flipped">True</Boolean>\n';
        }
        if ("WheelDoubleSpeed" in info && info["WheelDoubleSpeed"]) {
            xml += '        <Single key="bmt-speed">2</Single>\n';
        }

        xml += '      </Data>\n';
        xml += '    </Block>\n';
    }

    xml += '  </Blocks>\n';
    xml += '</Machine>';

    return xml;
}

/**
 * 主转换函数：JSON 到 XML
 * 对应 utils.py 中的 json_to_xml
 */
async function jsonToXML(inputObj, blockSizes) {
    let content;
    
    if (typeof inputObj === 'string') {
        content = extractJSONFromString(inputObj);
    } else if (Array.isArray(inputObj)) {
        content = inputObj;
    } else {
        throw new Error('Please make sure input type is string or array');
    }

    if (!content) {
        throw new Error('Failed to parse JSON');
    }

    let blockDetails = content;
    blockDetails = convertToNumpy(blockDetails);

    const { xmlBlockDetails, processedDetails, feedback } = await llm2xmlFiletree(
        blockDetails,
        blockSizes,
        null
    );

    const xmlString = createXML(xmlBlockDetails);

    return {
        xml: xmlString,
        feedback: feedback,
        processedDetails: processedDetails
    };
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createXML,
        jsonToXML
    };
}

