// 适配 EdgeOne 环境的企业微信加密解密库
class WXBizMsgCrypt {
    constructor(token, encodingAESKey, corpId) {
        this.token = token;
        this.corpId = corpId;
        
        // Base64 解码 AES Key
        const keyBase64 = encodingAESKey + '=';
        const keyStr = atob(keyBase64);
        this.key = new Uint8Array(keyStr.length);
        for (let i = 0; i < keyStr.length; i++) {
            this.key[i] = keyStr.charCodeAt(i);
        }
        this.iv = this.key.slice(0, 16);
    }

    // URL 验证
    verifyURL(msgSignature, timestamp, nonce, echostr) {
        console.log('开始验证URL...');
        
        const signature = this.getSignature(timestamp, nonce, echostr);
        console.log('计算签名:', signature);
        console.log('期望签名:', msgSignature);
        
        if (signature !== msgSignature) {
            throw new Error('签名验证失败');
        }
        
        return this.decrypt(echostr);
    }

    // 解密消息
    decryptMsg(msgSignature, timestamp, nonce, encryptedXml) {
        console.log('开始解密消息...');
        
        const { encrypt, toUserName } = this.extractFromXML(encryptedXml);
        const signature = this.getSignature(timestamp, nonce, encrypt);
        
        if (signature !== msgSignature) {
            throw new Error('消息签名验证失败');
        }

        const decrypted = this.decrypt(encrypt);
        const result = this.decodePKCS7(decrypted);
        
        // 转换为字符串
        const contentStr = new TextDecoder().decode(result);
        console.log('解密内容:', contentStr);
        
        // 解析消息结构
        const length = parseInt(contentStr.substring(0, 4), 16);
        const xmlContent = contentStr.substring(4, 4 + length);
        const fromCorpId = contentStr.substring(4 + length);

        if (fromCorpId !== this.corpId) {
            throw new Error('企业ID不匹配');
        }
        
        return xmlContent;
    }

    // 解密数据
    decrypt(encryptData) {
        try {
            // 这里需要实现 AES 解密逻辑
            // 由于 EdgeOne 环境限制，可能需要使用 Web Crypto API
            return this.simpleDecrypt(encryptData);
        } catch (error) {
            throw new Error('解密失败: ' + error.message);
        }
    }

    // 简化版解密（实际使用时需要完整实现）
    simpleDecrypt(encryptData) {
        // 这里是简化实现，实际需要完整的 AES-256-CBC 解密
        const decoded = Uint8Array.from(atob(encryptData), c => c.charCodeAt(0));
        return decoded;
    }

    // PKCS7 解码
    decodePKCS7(decrypted) {
        const pad = decrypted[decrypted.length - 1];
        if (pad < 1 || pad > 32) {
            return decrypted;
        }
        return decrypted.slice(0, decrypted.length - pad);
    }

    // 生成签名
    getSignature(timestamp, nonce, encrypt) {
        const arr = [this.token, timestamp, nonce, encrypt].sort();
        const raw = arr.join('');
        
        // 使用 SubtleCrypto 计算 SHA1
        return this.sha1(raw);
    }

    // SHA1 计算
    async sha1(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 从 XML 提取数据
    extractFromXML(xml) {
        const encryptMatch = xml.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/);
        const toUserMatch = xml.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/);
        
        return {
            encrypt: encryptMatch ? encryptMatch[1] : '',
            toUserName: toUserMatch ? toUserMatch[1] : ''
        };
    }
}
