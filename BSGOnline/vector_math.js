/**
 * 向量和矩阵数学运算库
 * 复现 numpy 的相关功能
 */

class Vector {
    /**
     * 向量加法
     */
    static add(v1, v2) {
        return v1.map((val, i) => val + v2[i]);
    }

    /**
     * 向量减法
     */
    static subtract(v1, v2) {
        return v1.map((val, i) => val - v2[i]);
    }

    /**
     * 向量数乘
     */
    static scale(v, scalar) {
        return v.map(val => val * scalar);
    }

    /**
     * 向量点积
     */
    static dot(v1, v2) {
        return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    }

    /**
     * 向量叉积
     */
    static cross(v1, v2) {
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }

    /**
     * 向量模长
     */
    static norm(v) {
        return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    }

    /**
     * 向量归一化
     */
    static normalize(v) {
        const n = Vector.norm(v);
        return n === 0 ? v : v.map(val => val / n);
    }

    /**
     * 判断向量是否全为零
     */
    static allclose(v1, v2, atol = 1e-8) {
        return v1.every((val, i) => Math.abs(val - v2[i]) < atol);
    }
}

class Matrix {
    /**
     * 矩阵乘法
     */
    static multiply(m1, m2) {
        const rows1 = m1.length;
        const cols1 = m1[0].length;
        const cols2 = m2[0].length;
        
        const result = Array(rows1).fill(0).map(() => Array(cols2).fill(0));
        
        for (let i = 0; i < rows1; i++) {
            for (let j = 0; j < cols2; j++) {
                for (let k = 0; k < cols1; k++) {
                    result[i][j] += m1[i][k] * m2[k][j];
                }
            }
        }
        
        return result;
    }

    /**
     * 矩阵与向量相乘
     */
    static multiplyVector(m, v) {
        return m.map(row => Vector.dot(row, v));
    }

    /**
     * 矩阵转置
     */
    static transpose(m) {
        return m[0].map((_, i) => m.map(row => row[i]));
    }

    /**
     * 3x3单位矩阵
     */
    static identity3() {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    /**
     * 判断是否为3x3矩阵
     */
    static is3x3(m) {
        return Array.isArray(m) && 
               m.length === 3 && 
               m.every(row => Array.isArray(row) && row.length === 3);
    }
}

/**
 * 数组操作工具
 */
class ArrayUtils {
    /**
     * 创建指定形状的全零数组
     */
    static zeros(shape) {
        if (typeof shape === 'number') {
            return Array(shape).fill(0);
        }
        if (shape.length === 1) {
            return Array(shape[0]).fill(0);
        }
        return Array(shape[0]).fill(0).map(() => ArrayUtils.zeros(shape.slice(1)));
    }

    /**
     * 数组的最小值
     */
    static min(arr) {
        if (arr[0] && Array.isArray(arr[0])) {
            // 多维数组
            const flattened = arr.flat(Infinity);
            return Math.min(...flattened);
        }
        return Math.min(...arr);
    }

    /**
     * 数组的最大值
     */
    static max(arr) {
        if (arr[0] && Array.isArray(arr[0])) {
            const flattened = arr.flat(Infinity);
            return Math.max(...flattened);
        }
        return Math.max(...arr);
    }

    /**
     * 沿着轴取最小值
     */
    static minAxis(arr, axis = 0) {
        if (axis === 0) {
            // 沿着第0轴（行）取最小值，返回每列的最小值
            return arr[0].map((_, colIndex) => 
                Math.min(...arr.map(row => row[colIndex]))
            );
        }
        // axis === 1: 返回每行的最小值
        return arr.map(row => Math.min(...row));
    }

    /**
     * 沿着轴取最大值
     */
    static maxAxis(arr, axis = 0) {
        if (axis === 0) {
            return arr[0].map((_, colIndex) => 
                Math.max(...arr.map(row => row[colIndex]))
            );
        }
        return arr.map(row => Math.max(...row));
    }

    /**
     * 数组四舍五入
     */
    static round(arr, decimals = 0) {
        const factor = Math.pow(10, decimals);
        if (Array.isArray(arr[0])) {
            return arr.map(row => ArrayUtils.round(row, decimals));
        }
        return arr.map(val => Math.round(val * factor) / factor);
    }

    /**
     * 判断两个数组是否近似相等
     */
    static allclose(arr1, arr2, atol = 1e-2) {
        if (arr1.length !== arr2.length) return false;
        
        if (Array.isArray(arr1[0])) {
            return arr1.every((row, i) => ArrayUtils.allclose(row, arr2[i], atol));
        }
        
        return arr1.every((val, i) => Math.abs(val - arr2[i]) < atol);
    }

    /**
     * 垂直堆叠数组
     */
    static vstack(arrays) {
        return arrays.reduce((acc, arr) => acc.concat(arr), []);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector, Matrix, ArrayUtils };
}

