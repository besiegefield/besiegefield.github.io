/**
 * 主应用逻辑
 * 整合所有模块，实现前端交互
 */

// 全局变量
let currentXML = '';
let currentXMLManual = '';

// 方块数据（硬编码，避免 CORS 问题）
let blockSizesData = {"0":{"name":"起始方块","block_type":"基础","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.0],"bc_bp":[[0.0,0.0,0.5],[0.0,0.0,-0.5],[-0.5,0.0,0.0],[0.5,0.0,0.0],[0.0,0.5,0.0],[0.0,-0.5,0.0]]},"15":{"name":"小型木块","block_type":"基础","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"1":{"name":"木块","block_type":"基础","bbox_size":[1.0,1.0,2.0],"bc_gc":[0.0,0.0,1.0],"bc_bp":[[0.0,0.0,2.0],[-0.5,0.0,0.5],[-0.5,0.0,1.5],[0.5,0.0,0.5],[0.5,0.0,1.5],[0.0,0.5,0.5],[0.0,0.5,1.5],[0.0,-0.5,0.5],[0.0,-0.5,1.5]]},"41":{"name":"木杆","block_type":"基础","bbox_size":[1.0,1.0,2.0],"bc_gc":[0.0,0.0,1.0],"bc_bp":[[0.0,0.0,2.0],[-0.5,0.0,0.5],[-0.5,0.0,1.5],[0.5,0.0,0.5],[0.5,0.0,1.5],[0.0,0.5,0.5],[0.0,0.5,1.5],[0.0,-0.5,0.5],[0.0,-0.5,1.5]]},"63":{"name":"原木","block_type":"基础","bbox_size":[1.0,1.0,3.0],"bc_gc":[0.0,0.0,1.5],"bc_bp":[[0.0,0.0,3.0],[-0.5,0.0,0.5],[-0.5,0.0,1.5],[-0.5,0.0,2.5],[0.5,0.0,0.5],[0.5,0.0,1.5],[0.5,0.0,2.5],[0.0,0.5,0.5],[0.0,0.5,1.5],[0.0,0.5,2.5],[0.0,-0.5,0.5],[0.0,-0.5,1.5],[0.0,-0.5,2.5]]},"28":{"name":"转向铰链","block_type":"行走","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0]]},"13":{"name":"转向块","block_type":"行走","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"2":{"name":"动力轮","block_type":"行走","bbox_size":[2.0,2.0,0.5],"bc_gc":[0.0,0.0,0.25],"bc_bp":[[0.0,0.0,0.5]]},"40":{"name":"无动力轮","block_type":"行走","bbox_size":[2.0,2.0,0.5],"bc_gc":[0.0,0.0,0.25],"bc_bp":[[0.0,0.0,0.5]]},"46":{"name":"动力大轮","block_type":"行走","bbox_size":[3.0,3.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1],[-1.5,0.0,1],[1.5,0.0,1],[0.0,1.5,1],[0.0,-1.5,1],[-1.5,0.0,0.5],[1.5,0.0,0.5],[0.0,1.5,0.5],[0.0,-1.5,0.5]]},"60":{"name":"无动力大轮","block_type":"行走","bbox_size":[3.0,3.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1],[-1.5,0.0,1],[1.5,0.0,1],[0.0,1.5,1],[0.0,-1.5,1],[-1.5,0.0,0.5],[1.5,0.0,0.5],[0.0,1.5,0.5],[0.0,-1.5,0.5]]},"50":{"name":"小轮","block_type":"行走","bbox_size":[0.5,1.0,1.5],"bc_gc":[0.0,0.0,0.75],"bc_bp":[]},"86":{"name":"滑板轮","block_type":"行走","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[]},"19":{"name":"万向节","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"5":{"name":"铰链","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"44":{"name":"球形关节","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"76":{"name":"轴连接件","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0]]},"22":{"name":"旋转块","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"27":{"name":"抓取器","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0]]},"20":{"name":"金属尖刺","block_type":"武器","bbox_size":[0.2,0.2,2.4],"bc_gc":[0.0,0.0,1.25],"bc_bp":[]},"3":{"name":"金属刀片","block_type":"武器","bbox_size":[1.0,0.1,3.8],"bc_gc":[0.0,0.0,2.0],"bc_bp":[]},"11":{"name":"火炮","block_type":"武器","bbox_size":[1.0,2.5,1.0],"bc_gc":[0.0,-0.5,0.5],"bc_bp":[]},"23":{"name":"炸弹","block_type":"武器","bbox_size":[1.9,1.9,1.9],"bc_gc":[0.0,0.0,0.95],"bc_bp":[]},"36":{"name":"巨石","block_type":"武器","bbox_size":[1.9,1.9,1.9],"bc_gc":[0.0,0.0,0.95],"bc_bp":[]},"49":{"name":"防滑垫","block_type":"护甲","bbox_size":[0.8,0.8,0.2],"bc_gc":[0.0,0.0,0.1],"bc_bp":[]},"87":{"name":"弹力垫","block_type":"护甲","bbox_size":[0.8,0.8,0.2],"bc_gc":[0.0,0.0,0.1],"bc_bp":[]},"30":{"name":"容器","block_type":"护甲","bbox_size":[2.4,3.0,2.8],"bc_gc":[0.0,0.0,1.4],"bc_bp":[[0.0,0.0,1.0]]},"6":{"name":"刺球","block_type":"护甲","bbox_size":[3.0,3.0,2.5],"bc_gc":[0.0,0.0,1.25],"bc_bp":[]},"16":{"name":"弹簧","block_type":"行走","bbox_size":[1.0,1.0,2.0],"bc_gc":[0.0,0.0,1.0],"bc_bp":[[0.0,0.0,2.0],[-0.5,0.0,1.5],[0.5,0.0,1.5],[0.0,0.5,1.5],[0.0,-0.5,1.5]]},"7":{"name":"钢筋","block_type":"线性","bbox_size":[],"bc_gc":[],"bc_bp":[]},"9":{"name":"皮筋","block_type":"线性","bbox_size":[],"bc_gc":[],"bc_bp":[]},"35":{"name":"配重物","block_type":"基础","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"32":{"name":"大型护甲板","block_type":"基础","bbox_size":[1.8,0.9,0.3],"bc_gc":[0.0,0.0,0.15],"bc_bp":[]},"24":{"name":"小型护甲板","block_type":"基础","bbox_size":[0.9,0.9,0.3],"bc_gc":[0.0,0.0,0.15],"bc_bp":[]},"18":{"name":"活塞","block_type":"机械","bbox_size":[1.0,1.0,2.0],"bc_gc":[0.0,0.0,1.0],"bc_bp":[[0.0,0.0,2.0],[-0.5,0.0,1.5],[0.5,0.0,1.5],[0.0,0.5,1.5],[0.0,-0.5,1.5]]},"18_1":{"name":"活塞(收缩)","block_type":"机械","bbox_size":[1.0,1.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"51":{"name":"无动力大齿轮","block_type":"机械","bbox_size":[5.0,5.0,1.0],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-1.0,0.0,1.0],[1.0,0.0,1.0],[0.0,1.0,1.0],[0.0,-1.0,1.0]]},"17":{"name":"圆盘锯","block_type":"武器","bbox_size":[2,2,0.5],"bc_gc":[0.0,0.0,0.25],"bc_bp":[]},"14":{"name":"飞行块","block_type":"行走","bbox_size":[1,1,1],"bc_gc":[0.0,0.0,0.5],"bc_bp":[]},"39":{"name":"中型动力齿轮","block_type":"行走","bbox_size":[2,2,1],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0]]},"4":{"name":"解耦器","block_type":"机械","bbox_size":[1,1,1],"bc_gc":[0.0,0.0,0.5],"bc_bp":[[0.0,0.0,1.0],[-0.5,0.0,0.5],[0.5,0.0,0.5],[0.0,0.5,0.5],[0.0,-0.5,0.5]]},"74":{"name":"热气球","block_type":"行走","bbox_size":[3,3,3],"bc_gc":[0.0,0.0,1.5],"bc_bp":[[0.0,0.0,3.0],[-1.5,0.0,1.5],[1.5,0.0,1.5],[0.0,1.5,1.5],[0.0,-1.5,1.5]]},"29":{"name":"装甲盘","block_type":"护甲","bbox_size":[2,2,0.3],"bc_gc":[0.0,0.0,0.15],"bc_bp":[]}};

// 内置的 System Prompt（不可修改）
const SYSTEM_PROMPT = `You are a machine builder. Your task is to generate a complete machine as a JSON file based on the user's request. Add new blocks to the initial structure; do not modify or delete it.

**Rules:**
1.  **Coordinate System:** Left-handed coordinate system, y+ upwards, z+ forward and x+ right.
1.  **Block Placement:** New blocks must attach to \`constructible_points\` of existing blocks. Blocks cannot overlap.
2.  **size Limit:** The final machine must not exceed dimensions of 17 (Length, Z), 17 (Width, X), 9.5 (Height, Y).
3.  **Functionality:** Ensure functional blocks are oriented correctly.
4.  **Efficiency:** Use as few blocks as possible without hurting performance.
5. **CoT & Token saving** You MUST think step by step, and MUST return both chat response and chain of thoughts (reasoning_content). Chat response in no more than 1,024 tokens, chain of thoughts no more than 800 tokens.

**Block Data:**
You can only use blocks from this list. A block's default orientation is Z+.
*   **constructible_points:**
    *   \`id\`: the i-th constructible_point of this block.
    *   \`pos\`: coordinates relative to the building center(which is the constructible_point of the parent block) of this block.
    *   \`orientation\`: orientation relative to the building center of this block.
*   **Tags:**
    *   \`Non-static\`: Block can generate force or movement.
    *   \`Non-stable\`: Connection to parent is not rigid (e.g., hinges, boulders).
    *   \`Linear\`: Do not collide with other blocks, but will occupy two constructible_points.
*   **Special Blocks:**
    *   **Boulder (id 36):** Does not physically connect to other blocks.
    *   **Rubber Band (id 9):** A linear block that pulls its two connection points together.

[{'name': 'Starting Block', 'description': 'Machine root. Cannot be placed or deleted, and only one can exist at a time. Initial position fixed, initial orientation is z+.', 'type id': 0, 'size': [1, 1, 1], 'constructible_points': [{'id': 0, 'pos': [0, 0, 0.5], 'orientation': 'Front'}, {'id': 1, 'pos': [0, 0, -0.5], 'orientation': 'Back'}, {'id': 2, 'pos': [-0.5, 0, 0], 'orientation': 'Left'}, {'id': 3, 'pos': [0.5, 0, 0], 'orientation': 'Right'}, {'id': 4, 'pos': [0, 0.5, 0], 'orientation': 'Up'}, {'id': 5, 'pos': [0, -0.5, 0], 'orientation': 'Down'}], 'mass': 0.25}, {'name': 'Small Wooden Block', 'description': 'A basic construction block, cubic in shape.', 'type id': 15, 'size': [1, 1, 1], 'constructible_points': [{'id': 0, 'pos': [0, 0, 1], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 3, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 4, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}], 'mass': 0.3}, {'name': 'Wooden Block', 'description': 'A basic construction block.', 'type id': 1, 'size': [1, 1, 2], 'constructible_points': [{'id': 0, 'pos': [0, 0, 2], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [-0.5, 0, 1.5], 'orientation': 'Left'}, {'id': 3, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 4, 'pos': [0.5, 0, 1.5], 'orientation': 'Right'}, {'id': 5, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 6, 'pos': [0, 0.5, 1.5], 'orientation': 'Up'}, {'id': 7, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}, {'id': 8, 'pos': [0, -0.5, 1.5], 'orientation': 'Down'}], 'mass': 0.5}, {'name': 'Wooden Rod', 'description': 'A basic construction block, slender and fragile.', 'type id': 41, 'size': [1, 1, 2], 'constructible_points': [{'id': 0, 'pos': [0, 0, 2], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [-0.5, 0, 1.5], 'orientation': 'Left'}, {'id': 3, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 4, 'pos': [0.5, 0, 1.5], 'orientation': 'Right'}, {'id': 5, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 6, 'pos': [0, 0.5, 1.5], 'orientation': 'Up'}, {'id': 7, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}, {'id': 8, 'pos': [0, -0.5, 1.5], 'orientation': 'Down'}], 'mass': 0.5}, {'name': 'Log', 'description': 'A basic construction block.', 'type id': 63, 'size': [1, 1, 3], 'constructible_points': [{'id': 0, 'pos': [0, 0, 3], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [-0.5, 0, 1.5], 'orientation': 'Left'}, {'id': 3, 'pos': [-0.5, 0, 2.5], 'orientation': 'Left'}, {'id': 4, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 5, 'pos': [0.5, 0, 1.5], 'orientation': 'Right'}, {'id': 6, 'pos': [0.5, 0, 2.5], 'orientation': 'Right'}, {'id': 7, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 8, 'pos': [0, 0.5, 1.5], 'orientation': 'Up'}, {'id': 9, 'pos': [0, 0.5, 2.5], 'orientation': 'Up'}, {'id': 10, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}, {'id': 11, 'pos': [0, -0.5, 1.5], 'orientation': 'Down'}, {'id': 12, 'pos': [0, -0.5, 2.5], 'orientation': 'Down'}], 'mass': 1}, {'name': 'Rotating Block', 'description': 'Powered, spins about its placement-normal axis. Only sub-blocks on constructible_points 1 to 4 rotate with it. Rotation torque is passed to its parent, scaled by the total weight of itself and all descendant sub-blocks; seen from the normal that points into the block, it turns clockwise, reversing to counter-clockwise only when the block faces x-.', 'type id': 22, 'size': [1, 1, 1], 'constructible_points': [{'id': 0, 'pos': [0, 0, 1], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 3, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 4, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}], 'Special Attributes': {'Rotation Axis': 'Front', 'NonStatic': 'True', 'NonStable': 'True'}, 'mass': 1}, {'name': 'Boulder', 'description': 'A rock that will not directly connect to other blocks even if built on them, high mass.', 'type id': 36, 'size': [1.9, 1.9, 1.9], 'Special Attributes': {'NonStable': 'True'}, 'mass': 5}, {'name': 'Container', 'description': 'Has railing around the build point. If towards y+, can hold sub-blocks like a bowl. Mainly used to hold loose block such as boulder. keep around clear to avoid overlap.', 'type id': 30, 'size': [2.4, 3, 2.8], 'constructible_points': [{'id': 0, 'pos': [0, 0, 1], 'orientation': 'Front'}], 'mass': 0.5}, {'name': 'Spring', 'description': 'It primarily serves as a buffer and shock absorber. It is similar in shape to a wooden block, with all constructible_points located at the far end of the block.', 'type id': 16, 'size': [1, 1, 2], 'constructible_points': [{'id': 0, 'pos': [0, 0, 2], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 1.5], 'orientation': 'Left'}, {'id': 2, 'pos': [0.5, 0, 1.5], 'orientation': 'Right'}, {'id': 3, 'pos': [0, 0.5, 1.5], 'orientation': 'Up'}, {'id': 4, 'pos': [0, -0.5, 1.5], 'orientation': 'Down'}], 'mass': 0.5}, {'name': 'Rubber Band', 'description': 'A linear block that attaches to two other blocks and can quickly pull the two ends together. Its tension force is almost entirely dependent on its length.', 'type id': 9, 'Special Attributes': {'Linear': 'True', 'NonStatic': 'True', 'Tension Direction': 'Towards the center of the line segment between the two constructible_points'}, 'mass': 0.4}, {'name': 'Ballast', 'description': 'It serves as a counterweight, has a large mass, and is shaped like a cube.', 'type id': 35, 'size': [1, 1, 1], 'constructible_points': [{'id': 0, 'pos': [0, 0, 1], 'orientation': 'Front'}, {'id': 1, 'pos': [-0.5, 0, 0.5], 'orientation': 'Left'}, {'id': 2, 'pos': [0.5, 0, 0.5], 'orientation': 'Right'}, {'id': 3, 'pos': [0, 0.5, 0.5], 'orientation': 'Up'}, {'id': 4, 'pos': [0, -0.5, 0.5], 'orientation': 'Down'}], 'mass': 3},{
        "name": "Powered Wheel",
        "description": "Powered, a mechanical device used to move objects on the ground, the wheel's build orientation is tangent to its intended rolling direction, which lies parallel to the XZ plane.",
        "type id": 2,
        "size": [2, 2, 0.5],
        "constructible_points": [
            {"ID": 0, "pos": [0, 0, 0.5], "orientation": "Front"}
        ],
        "Special Attributes": {
            "Rotation Axis": "Front",
            NonStatic': 'True', 'NonStable': 'True',
            "direction of power": [
                {"facing": "x+", "direction": "z+"},
                {"facing": "x-", "direction": "z+"},
                {"facing": "z+", "direction": "x-"},
                {"facing": "z-", "direction": "x+"}
            ]
        },
        "mass": 1
    }]

**JSON Output Format: Do not add items not mentioned below**
*   **id**: block type_id
*   **order_id**: this is i-th block
*   **parent**: parent block's order_id
*   **bp_id**: parent block's constructible_point id
*   **Standard Block:** \`{\"id\": <int>, \"order_id\": <int>, \"parent\": <int>, \"bp_id\": <int>}\`
*   **Linear Block (id: 9):** \`{\"id\": 9, \"order_id\": <int>, \"parent_a\": <int>, \"bp_id_a\": <int>, \"parent_b\": <int>, \"bp_id_b\": <int>}\`

**Final Response Format:**
Your response must contain **only** these three parts:
0. \`Chain of thoughts:\` You need to think step by step, analyse each block's usage and where to place them. Put your cot in <cot></cot>
1.  \`Construction Idea:\` A brief explanation of your design,remember to consider necessary block types, note them in \`\`\`necessary_blocks [type_1,type_2 ...]\`\`\`, no more than 300 words.
2.  \`JSON:\` The complete JSON code inside a \`\`\`json ... \`\`\` block. here is an example: \`\`\`json
    [
        {\"id\":\"0\",\"order_id\":0,\"parent\":-1,\"bp_id\":-1},
        {\"id\": <int>, \"order_id\": <int>, \"parent\": <int>, \"bp_id\": <int>},
        ...
    ]
\`\`\`
`;

/**
 * Initialize application on page load
 */
async function initializeApp() {
    // Data is hardcoded in the file, no need to load
    console.log('✅ Block data loaded (hardcoded version, no CORS issues)');
    console.log(`📦 Loaded ${Object.keys(blockSizesData).length} block types`);
}

/**
 * Switch tabs
 */
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    if (tab === 'ai') {
        tabs[0].classList.add('active');
        document.getElementById('ai-tab').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('manual-tab').classList.add('active');
    }
}

// Model selection handler removed - now using direct input only

/**
 * AI 生成机器
 */
async function generateMachine() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiBase = document.getElementById('apiBase').value.trim();
    const model = document.getElementById('customModel').value.trim();
    const userInput = document.getElementById('userInput').value.trim();
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const gptOutput = document.getElementById('gptOutput');
    const xmlOutput = document.getElementById('xmlOutput');

    if (!apiKey) {
        result.innerHTML = '<div class="error">❌ Please enter API Key</div>';
        return;
    }

    if (!model) {
        result.innerHTML = '<div class="error">❌ Please enter Model Name</div>';
        return;
    }

    if (!userInput) {
        result.innerHTML = '<div class="error">❌ Please describe the machine you want to create</div>';
        return;
    }

    if (!blockSizesData) {
        result.innerHTML = '<div class="error">❌ Block data not loaded, please refresh the page</div>';
        return;
    }

    loading.classList.add('active');
    result.innerHTML = '';
    gptOutput.style.display = 'none';
    xmlOutput.style.display = 'none';

    try {
        // 调用 OpenAI API
        const baseURL = apiBase || 'https://api.openai.com/v1';
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userInput }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API call failed');
        }

        const data = await response.json();
        const gptResponse = data.choices[0].message.content;

        // Display AI response
        document.getElementById('gptResponseText').textContent = gptResponse;
        gptOutput.style.display = 'block';

        // Convert to XML
        try {
            const { xml, feedback } = await jsonToXML(gptResponse, blockSizesData);
            document.getElementById('xmlOutputText').textContent = xml;
            currentXML = xml;
            xmlOutput.style.display = 'block';
            
            let message = '✅ Successfully generated!';
            if (feedback) {
                message += '<br><br>⚠️ Conversion warnings:<br>' + feedback.replace(/\n/g, '<br>');
            }
            result.innerHTML = `<div class="success">${message}</div>`;
        } catch (convertError) {
            result.innerHTML = `<div class="error">❌ XML conversion failed: ${convertError.message}<br><br>The AI response may be incorrectly formatted. Please check the JSON output above and manually correct it in the "Manual Conversion" tab.</div>`;
        }

    } catch (error) {
        result.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    } finally {
        loading.classList.remove('active');
    }
}

/**
 * Manual JSON conversion
 */
async function convertJSON() {
    const jsonInput = document.getElementById('jsonInput').value.trim();
    const loading = document.getElementById('loadingManual');
    const result = document.getElementById('resultManual');
    const xmlOutput = document.getElementById('xmlOutputManual');

    if (!jsonInput) {
        result.innerHTML = '<div class="error">❌ Please enter JSON data</div>';
        return;
    }

    if (!blockSizesData) {
        result.innerHTML = '<div class="error">❌ Block data not loaded, please refresh the page</div>';
        return;
    }

    loading.classList.add('active');
    result.innerHTML = '';
    xmlOutput.style.display = 'none';

    try {
        const { xml, feedback } = await jsonToXML(jsonInput, blockSizesData);
        document.getElementById('xmlOutputTextManual').textContent = xml;
        currentXMLManual = xml;
        xmlOutput.style.display = 'block';
        
        let message = '✅ Successfully converted!';
        if (feedback) {
            message += '<br><br>⚠️ Conversion warnings:<br>' + feedback.replace(/\n/g, '<br>');
        }
        result.innerHTML = `<div class="success">${message}</div>`;
    } catch (error) {
        result.innerHTML = `<div class="error">❌ Conversion failed: ${error.message}</div>`;
    } finally {
        loading.classList.remove('active');
    }
}

/**
 * Copy to clipboard
 */
function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Copied to clipboard!');
    }).catch(err => {
        alert('❌ Copy failed: ' + err);
    });
}

/**
 * Download XML
 */
function downloadXML() {
    if (!currentXML) {
        alert('❌ No content to download');
        return;
    }
    downloadFile(currentXML, 'machine.bsg');
}

function downloadXMLManual() {
    if (!currentXMLManual) {
        alert('❌ No content to download');
        return;
    }
    downloadFile(currentXMLManual, 'machine.bsg');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

