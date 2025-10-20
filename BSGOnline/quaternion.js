/**
 * 四元数和旋转类 - 复现 scipy.spatial.transform.Rotation
 * 严格按照 Python 版本实现
 */

class Quaternion {
    /**
     * 四元数 [x, y, z, w] 格式
     */
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * 从数组创建
     */
    static fromArray(arr) {
        return new Quaternion(arr[0], arr[1], arr[2], arr[3]);
    }

    /**
     * 转换为数组 [x, y, z, w]
     */
    toArray() {
        return [this.x, this.y, this.z, this.w];
    }

    /**
     * 归一化
     */
    normalize() {
        const norm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        if (norm === 0) return this;
        this.x /= norm;
        this.y /= norm;
        this.z /= norm;
        this.w /= norm;
        return this;
    }

    /**
     * 四元数乘法
     */
    multiply(q) {
        const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
        const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x;
        const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w;
        const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
        return new Quaternion(x, y, z, w);
    }

    /**
     * 共轭
     */
    conjugate() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    /**
     * 逆
     */
    inverse() {
        const normSq = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        const conj = this.conjugate();
        return new Quaternion(
            conj.x / normSq,
            conj.y / normSq,
            conj.z / normSq,
            conj.w / normSq
        );
    }

    /**
     * 转换为旋转矩阵 (3x3)
     */
    toMatrix() {
        const { x, y, z, w } = this;
        
        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, xw = x * w;
        const yz = y * z, yw = y * w, zw = z * w;

        return [
            [1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (xz + yw)],
            [2 * (xy + zw), 1 - 2 * (xx + zz), 2 * (yz - xw)],
            [2 * (xz - yw), 2 * (yz + xw), 1 - 2 * (xx + yy)]
        ];
    }

    /**
     * 计算与另一个四元数的角度差（弧度）
     */
    angleTo(q) {
        const dot = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
        const clampedDot = Math.max(-1, Math.min(1, Math.abs(dot)));
        return 2 * Math.acos(clampedDot);
    }
}

class Rotation {
    /**
     * 旋转类 - 复现 scipy.spatial.transform.Rotation
     */
    constructor(quaternion) {
        if (quaternion instanceof Quaternion) {
            this.quat = quaternion;
        } else if (Array.isArray(quaternion)) {
            this.quat = Quaternion.fromArray(quaternion);
        } else {
            this.quat = new Quaternion();
        }
        this.quat.normalize();
    }

    /**
     * 从四元数创建 (xyzw 格式)
     */
    static from_quat(quat) {
        return new Rotation(quat);
    }

    /**
     * 从旋转矩阵创建
     */
    static from_matrix(matrix) {
        // 从3x3旋转矩阵转换为四元数
        const m = matrix;
        const trace = m[0][0] + m[1][1] + m[2][2];
        let quat;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            quat = new Quaternion(
                (m[2][1] - m[1][2]) * s,
                (m[0][2] - m[2][0]) * s,
                (m[1][0] - m[0][1]) * s,
                0.25 / s
            );
        } else {
            if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
                const s = 2.0 * Math.sqrt(1.0 + m[0][0] - m[1][1] - m[2][2]);
                quat = new Quaternion(
                    0.25 * s,
                    (m[0][1] + m[1][0]) / s,
                    (m[0][2] + m[2][0]) / s,
                    (m[2][1] - m[1][2]) / s
                );
            } else if (m[1][1] > m[2][2]) {
                const s = 2.0 * Math.sqrt(1.0 + m[1][1] - m[0][0] - m[2][2]);
                quat = new Quaternion(
                    (m[0][1] + m[1][0]) / s,
                    0.25 * s,
                    (m[1][2] + m[2][1]) / s,
                    (m[0][2] - m[2][0]) / s
                );
            } else {
                const s = 2.0 * Math.sqrt(1.0 + m[2][2] - m[0][0] - m[1][1]);
                quat = new Quaternion(
                    (m[0][2] + m[2][0]) / s,
                    (m[1][2] + m[2][1]) / s,
                    0.25 * s,
                    (m[1][0] - m[0][1]) / s
                );
            }
        }
        
        return new Rotation(quat);
    }

    /**
     * 从旋转向量创建
     */
    static from_rotvec(rotvec) {
        const angle = Math.sqrt(rotvec[0] * rotvec[0] + rotvec[1] * rotvec[1] + rotvec[2] * rotvec[2]);
        
        if (angle === 0) {
            return new Rotation([0, 0, 0, 1]);
        }

        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle) / angle;
        
        return new Rotation([
            rotvec[0] * s,
            rotvec[1] * s,
            rotvec[2] * s,
            Math.cos(halfAngle)
        ]);
    }

    /**
     * 转换为四元数 (xyzw 格式)
     */
    as_quat() {
        return this.quat.toArray();
    }

    /**
     * 转换为旋转矩阵 (3x3)
     */
    as_matrix() {
        return this.quat.toMatrix();
    }

    /**
     * 旋转乘法（组合两个旋转）
     */
    multiply(other) {
        const q = this.quat.multiply(other.quat);
        return new Rotation(q);
    }

    /**
     * 逆旋转
     */
    inv() {
        return new Rotation(this.quat.inverse());
    }

    /**
     * 旋转的大小（弧度）
     */
    magnitude() {
        const w = this.quat.w;
        const angle = 2 * Math.acos(Math.max(-1, Math.min(1, Math.abs(w))));
        return angle;
    }

    /**
     * 应用旋转到向量
     */
    apply(vectors) {
        const isMultiple = Array.isArray(vectors[0]);
        const vecs = isMultiple ? vectors : [vectors];
        
        const results = vecs.map(v => {
            // 四元数旋转: v' = q * v * q^(-1)
            const vQuat = new Quaternion(v[0], v[1], v[2], 0);
            const result = this.quat.multiply(vQuat).multiply(this.quat.conjugate());
            return [result.x, result.y, result.z];
        });

        return isMultiple ? results : results[0];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Quaternion, Rotation };
}

