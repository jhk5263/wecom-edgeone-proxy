// 腾讯 EdgeOne 边缘函数
import config from './config.js';
import { WXBizMsgCrypt } from './wecom-crypt.js';

// 主处理函数
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        console.log('收到请求:', {
            method: request.method,
            path: path,
            query: Object.fromEntries(url.searchParams)
        });

        // 企业微信 URL 验证
        if (path === '/wecom' && request.method === 'GET') {
            return handleWeComVerify(url.searchParams);
        }
        
        // 企业微信消息接收
        if (path === '/wecom' && request.method === 'POST') {
            return handleWeComMessage(request, url.searchParams);
        }
        
        // 健康检查
        if (path === '/health') {
            return new Response('OK', { status: 200 });
        }
        
        // 默认返回 GitHub Pages
        return fetch(config.GITHUB_PAGES_URL + path);
    }
};

// 处理企业微信 URL 验证
async function handleWeComVerify(params) {
    try {
        const msgSignature = params.get('msg_signature');
        const timestamp = params.get('timestamp');
        const nonce = params.get('nonce');
        const echostr = params.get('echostr');
        
        console.log('验证参数:', { msgSignature, timestamp, nonce, echostr });
        
        if (!msgSignature || !timestamp || !nonce || !echostr) {
            return new Response('缺少必要参数', { status: 400 });
        }
        
        const crypt = new WXBizMsgCrypt(
            config.WECOM_TOKEN,
            config.WECOM_ENCODING_AES_KEY,
            config.WECOM_CORP_ID
        );
        
        const result = await crypt.verifyURL(msgSignature, timestamp, nonce, echostr);
        console.log('验证成功:', result);
        
        return new Response(result, {
            headers: { 'Content-Type': 'text/plain' }
        });
        
    } catch (error) {
        console.error('验证失败:', error);
        return new Response('Error: ' + error.message, { status: 500 });
    }
}

// 处理企业微信消息
async function handleWeComMessage(request, params) {
    try {
        const msgSignature = params.get('msg_signature');
        const timestamp = params.get('timestamp');
        const nonce = params.get('nonce');
        
        if (!msgSignature || !timestamp || !nonce) {
            return new Response('缺少必要参数', { status: 400 });
        }
        
        const xmlBody = await request.text();
        console.log('收到消息XML:', xmlBody);
        
        const crypt = new WXBizMsgCrypt(
            config.WECOM_TOKEN,
            config.WECOM_ENCODING_AES_KEY,
            config.WECOM_CORP_ID
        );
        
        const decryptedXml = await crypt.decryptMsg(msgSignature, timestamp, nonce, xmlBody);
        console.log('解密后的XML:', decryptedXml);
        
        // 解析消息内容
        const message = parseWeComMessage(decryptedXml);
        if (message) {
            await sendToTelegram(message);
        }
        
        return new Response('success', {
            headers: { 'Content-Type': 'text/plain' }
        });
        
    } catch (error) {
        console.error('处理消息失败:', error);
        return new Response('success', { status: 200 }); // 仍然返回success防止重试
    }
}

// 解析企业微信消息
function parseWeComMessage(xml) {
    const fromUserMatch = xml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/);
    const contentMatch = xml.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/);
    const msgTypeMatch = xml.match(/<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/);
    
    if (msgTypeMatch && msgTypeMatch[1] === 'text' && fromUserMatch && contentMatch) {
        return {
            fromUser: fromUserMatch[1],
            content: contentMatch[1],
            msgType: 'text'
        };
    }
    
    return null;
}

// 发送消息到 Telegram
async function sendToTelegram(message) {
    try {
        const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const text = `来自企业微信 (${message.fromUser}):\n${message.content}`;
        
        const payload = {
            chat_id: config.TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log('Telegram发送结果:', result.ok ? '成功' : '失败');
        
    } catch (error) {
        console.error('发送到Telegram失败:', error);
    }
}edgeone-function.js
