// Typewriter 配置数据
const typewriterStages = [
    {
        row: 1,
        rowWidth: 1200,  // 手动设置该 row 的总宽度（代码区+图片区）
        code: `Let's build a catapult!
<starting_block        parent=-1                    attach_to=-1>
<small_woolden_block_1 parent=starting_block        attach_to=face_1>
<small_woolden_block_2 parent=starting_block        attach_to=face_2>
<small_woolden_block_3 parent=small_woolden_block_1 attach_to=face_1>
<small_woolden_block_4 parent=small_woolden_block_2 attach_to=face_3>
<woolden_block_1       parent=starting_block        attach_to=face_3>
<woolden_block_2       parent=woolden_block_1       attach_to=face_3>
<small_woolden_block_5 parent=starting_block        attach_to=face_0>
<woolden_block_3       parent=small_woolden_block_5 attach_to=face_5>
<spinning_block_1      parent=woolden_block_3       attach_to=face_2>
<log_1                 parent=spinning_block_1      attach_to=face_3>
<holder_1              parent=log_1                 attach_to=face_0>
<boulder_1             parent=holder_1              attach_to=face_0>
`,
        lineMap: {
            3: 'figures/agentic_building/build/1.png',
            4: 'figures/agentic_building/build/2.png',
            5: 'figures/agentic_building/build/3.png',
            6: 'figures/agentic_building/build/4.png',
            7: 'figures/agentic_building/build/5.png',
            8: 'figures/agentic_building/build/6.png',
            9: 'figures/agentic_building/build/7.png',
            10: 'figures/agentic_building/build/8.png',
            11: 'figures/agentic_building/build/9.png',
            12: 'figures/agentic_building/build/10.png',
            13: 'figures/agentic_building/build/11.png',
            14: 'figures/agentic_building/build/12.png'
        },
        defaultPic: 'figures/agentic_building/build/0.png',
        imageWidth: 500,
        stageHeight: 400
    },
    {
        row: 2,
        rowWidth: 1200,  // 手动设置该 row 的总宽度
        code: `Catapult refine!
delete(target=small_woolden_block_3)
delete(target=small_woolden_block_4)
delete(target=woolden_block_2)
delete(target=small_woolden_block_1)
delete(target=small_woolden_block_2)
delete(target=woolden_block_1)
move(target=log_1, to=spinning_block_1, face=face_2)
move(target=holder_1, to=log_1, face=face_8)
add(target=ballast_1, to=spinning_block_1, face=face_1)
add(target=log_2, to=starting_block, face=face_1)
add(target=log_3, to=starting_block, face=face_2)
add(target=log_4, to=starting_block, face=face_3)
`,
        lineMap: {
            2: 'figures/agentic_building/modify/13.png',
            3: 'figures/agentic_building/modify/14.png',
            4: 'figures/agentic_building/modify/15.png',
            5: 'figures/agentic_building/modify/16.png',
            6: 'figures/agentic_building/modify/17.png',
            7: 'figures/agentic_building/modify/18.png',
            8: 'figures/agentic_building/modify/19.png',
            9: 'figures/agentic_building/modify/20.png',
            10: 'figures/agentic_building/modify/21.png',
            11: 'figures/agentic_building/modify/22.png',
            12: 'figures/agentic_building/modify/23.png',
            13: 'figures/agentic_building/modify/24.png'
        },
        defaultPic: 'figures/agentic_building/build/12.png',
        imageWidth: 500,
        stageHeight: 400
    }
];

