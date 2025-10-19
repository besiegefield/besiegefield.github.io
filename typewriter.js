// Typewriter 功能模块
(function() {
    'use strict';

    const charInterval = 10;
    const cacheVersion = '20251019';

    function measureCodeWidth(code, measureEl) {
        measureEl.textContent = '';
        const lines = code.split('\n');
        let maxWidth = 0;
        lines.forEach(line => {
            measureEl.textContent = line;
            const width = measureEl.offsetWidth;
            if (width > maxWidth) maxWidth = width;
        });
        return maxWidth + 40;
    }

    function highlightChar(ch, prevChars) {
        const fullText = prevChars.join('');
        const currentLine = fullText.split('\n').pop();
        
        // 提取当前单词（从行首到当前位置，包含即将添加的字符）
        const currentWord = (currentLine.trim() + ch).toLowerCase();
        
        // 检查是否在 delete/move/add 单词中
        const keywords = ['delete', 'move', 'add'];
        const isInKeyword = keywords.some(kw => kw.startsWith(currentWord) && /^[a-z]+$/.test(currentWord));
        
        if (isInKeyword && /[a-z]/.test(ch)) {
            return '<span class="xml-function-name">' + ch + '</span>';
        }
        
        // 检查是否是函数调用格式
        const trimmedLine = currentLine.trim();
        const hasFunctionCall = /^(delete|move|add)\(/.test(trimmedLine) || /\([^)]*$/.test(trimmedLine);
        
        if (hasFunctionCall) {
            // 函数调用格式的语法高亮
            const lastOpenParen = currentLine.lastIndexOf('(');
            const lastCloseParen = currentLine.lastIndexOf(')');
            const inFunctionParams = lastOpenParen !== -1 && (lastCloseParen === -1 || lastOpenParen > lastCloseParen);
            
            // 括号
            if (ch === '(') return '(';
            if (ch === ')') return ')';
            
            // 逗号
            if (ch === ',') return ',';
            
            // 等号
            if (ch === '=') return ch;
            
            // 空格
            if (ch === ' ') return ch;
            
            if (inFunctionParams) {
                // 在括号内
                const inParams = currentLine.substring(lastOpenParen + 1);
                const lastEqual = inParams.lastIndexOf('=');
                const lastComma = inParams.lastIndexOf(',');
                
                // 判断当前位置
                const afterLastDelimiter = Math.max(lastEqual, lastComma, 0);
                const afterDelimiter = inParams.substring(afterLastDelimiter + 1);
                
                if (lastEqual > lastComma) {
                    // 在等号之后，逗号之前 -> 参数值
                    if (!/[,\s]/.test(afterDelimiter)) {
                        if (/[\d\-]/.test(ch)) {
                            return '<span class="xml-number">' + ch + '</span>';
                        }
                        if (/[a-zA-Z0-9_]/.test(ch)) {
                            return '<span class="xml-attr-value">' + ch + '</span>';
                        }
                    }
                } else {
                    // 在逗号之后或开始，等号之前 -> 参数名
                    if (!/=/.test(afterDelimiter)) {
                        if (/[a-z_]/.test(ch)) {
                            return '<span class="xml-attr-name">' + ch + '</span>';
                        }
                    }
                }
            }
            
            return ch;
        } else {
            // XML 格式的语法高亮
            const lastOpenBracket = currentLine.lastIndexOf('<');
            const lastCloseBracket = currentLine.lastIndexOf('>');
            const inTag = lastOpenBracket > lastCloseBracket && lastOpenBracket !== -1;

            if (ch === '<') return '<span class="xml-tag-bracket">&lt;</span>';
            if (ch === '>') return '<span class="xml-tag-bracket">&gt;</span>';
            if (!inTag) return ch;

            const inTagContent = currentLine.substring(lastOpenBracket + 1);
            if (ch === '=' || ch === ' ') return ch;

            const lastSpaceInTag = inTagContent.lastIndexOf(' ');
            const lastEqualInTag = inTagContent.lastIndexOf('=');

            if (lastSpaceInTag === -1) {
                if (/[a-zA-Z0-9_]/.test(ch)) return '<span class="xml-tag-name">' + ch + '</span>';
            } else if (lastEqualInTag > lastSpaceInTag) {
                const afterEqual = inTagContent.substring(lastEqualInTag + 1);
                if (!/\s/.test(afterEqual)) {
                    if (/[\d\-]/.test(ch)) return '<span class="xml-number">' + ch + '</span>';
                    if (/[a-zA-Z0-9_]/.test(ch)) return '<span class="xml-attr-value">' + ch + '</span>';
                }
            } else if (lastSpaceInTag > lastEqualInTag) {
                const afterSpace = inTagContent.substring(lastSpaceInTag + 1);
                if (!/=/.test(afterSpace)) {
                    if (/[a-zA-Z_]/.test(ch)) return '<span class="xml-attr-name">' + ch + '</span>';
                }
            }
            return ch;
        }
    }

    function createStage(config, measureEl) {
        const { code, lineMap, defaultPic, imageWidth, stageHeight, _adjustedCodeWidth, _adjustedTotalWidth } = config;
        
        // 使用调整后的宽度，如果没有则使用原始计算
        const codeWidth = _adjustedCodeWidth !== undefined ? _adjustedCodeWidth : measureCodeWidth(code, measureEl);
        const totalWidth = _adjustedTotalWidth !== undefined ? _adjustedTotalWidth : (codeWidth + imageWidth);

        const stage = document.createElement('div');
        stage.className = 'typewriter-stage';
        stage.style.width = totalWidth + 'px';
        stage.style.height = stageHeight + 'px';

        const left = document.createElement('div');
        left.className = 'typewriter-left';
        left.style.width = codeWidth + 'px';

        const pre = document.createElement('pre');
        const codeBlock = document.createElement('code');
        pre.appendChild(codeBlock);
        left.appendChild(pre);

        const right = document.createElement('div');
        right.className = 'typewriter-right';
        right.style.width = imageWidth + 'px';

        const img = document.createElement('img');
        img.src = defaultPic + '?v=' + cacheVersion;
        right.appendChild(img);

        const ctrl = document.createElement('div');
        ctrl.className = 'typewriter-ctrl';
        ctrl.innerHTML = '<button class="play-btn">▶ Play</button><button class="pause-btn">⏸ Pause</button><button class="replay-btn">🔄 Replay</button>';

        stage.appendChild(left);
        stage.appendChild(right);
        stage.appendChild(ctrl);

        // 预加载图片
        const allImages = [defaultPic, ...Object.values(lineMap)];
        allImages.forEach(src => {
            const preloadImg = new Image();
            preloadImg.src = src + '?v=' + cacheVersion;
        });

        let index = 0, timer = null, paused = false, currentLine = 1;

        function setImage(url) {
            img.src = (url || defaultPic) + '?v=' + cacheVersion;
        }

        function typeChar() {
            if (paused) return;
            if (index >= code.length) {
                clearInterval(timer);
                codeBlock.insertAdjacentHTML('beforeend', '<span class="typewriter-cursor"></span>');
                setTimeout(() => replay(), 3000);
                return;
            }
            const ch = code[index++];
            const prevChars = code.slice(0, index - 1).split('');
            let displayCh = ch;
            if (ch === '&') displayCh = '&amp;';
            else if (ch === '\n') displayCh = '\n';
            else displayCh = highlightChar(ch, prevChars);

            if (ch === '\n') {
                codeBlock.insertAdjacentHTML('beforeend', '\n');
                currentLine++;
                if (lineMap[currentLine]) setImage(lineMap[currentLine]);
            } else {
                codeBlock.insertAdjacentHTML('beforeend', displayCh);
            }

            const oldCur = codeBlock.querySelector('.typewriter-cursor');
            if (oldCur) oldCur.remove();
            codeBlock.insertAdjacentHTML('beforeend', '<span class="typewriter-cursor"></span>');
            pre.scrollTop = pre.scrollHeight;
        }

        function start() {
            paused = false;
            if (timer) clearInterval(timer);
            timer = setInterval(typeChar, charInterval);
        }

        function pause() { paused = true; }

        function replay() {
            codeBlock.innerHTML = '';
            index = 0;
            currentLine = 1;
            setImage(defaultPic);
            start();
        }

        ctrl.querySelector('.play-btn').onclick = start;
        ctrl.querySelector('.pause-btn').onclick = pause;
        ctrl.querySelector('.replay-btn').onclick = replay;

        start();
        return stage;
    }

    // 导出初始化函数
    window.initTypewriter = function(containerId, stages) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Typewriter container not found:', containerId);
            return;
        }

        // 创建测量元素
        let measureEl = document.getElementById('typewriter-measure');
        if (!measureEl) {
            measureEl = document.createElement('div');
            measureEl.id = 'typewriter-measure';
            document.body.appendChild(measureEl);
        }

        // 按行分组
        const rowGroups = {};
        stages.forEach(config => {
            const row = config.row || 1;
            if (!rowGroups[row]) rowGroups[row] = [];
            rowGroups[row].push(config);
        });

        // 创建舞台
        const sortedRows = Object.keys(rowGroups).sort((a, b) => a - b);
        sortedRows.forEach(rowNum => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'typewriter-row';

            const rowConfigs = rowGroups[rowNum];
            
            // 计算该行的最大高度
            const maxRowHeight = Math.max(...rowConfigs.map(c => c.stageHeight));
            
            // 获取该 row 的宽度：手动设置的 rowWidth 或自动计算
            let maxRowWidth;
            const firstConfig = rowConfigs[0];
            if (firstConfig.rowWidth !== undefined) {
                // 使用手动设置的宽度
                maxRowWidth = firstConfig.rowWidth;
            } else {
                // 自动计算最大宽度
                const rowWidths = rowConfigs.map(c => {
                    const codeWidth = measureCodeWidth(c.code, measureEl);
                    return codeWidth + c.imageWidth;
                });
                maxRowWidth = Math.max(...rowWidths);
            }

            rowConfigs.forEach((config, index) => {
                // 计算调整后的代码区宽度
                const adjustedCodeWidth = maxRowWidth - config.imageWidth;
                
                // 创建统一配置：统一高度和宽度
                const uniformConfig = { 
                    ...config, 
                    stageHeight: maxRowHeight,
                    _adjustedCodeWidth: adjustedCodeWidth,
                    _adjustedTotalWidth: maxRowWidth
                };
                const stage = createStage(uniformConfig, measureEl);
                rowDiv.appendChild(stage);
            });

            container.appendChild(rowDiv);
        });
    };
})();

