// 配置信息 - 实际部署时替换为环境变量
const config = {
    // 企业微信配置
    WECOM_TOKEN: "oTrlLFGuI90iURE",
    WECOM_ENCODING_AES_KEY: "hXDBUD2ovLbJHy6GFlboezynhQreH5H5hsUv9GnKky6",
    WECOM_CORP_ID: "ww61fe622e757a2698",
    
    // Telegram 配置
    TELEGRAM_BOT_TOKEN: "8496802608:AAG4rhvFxiIsLVmxREhC4BByVDaMBkMQHjo",
    TELEGRAM_CHAT_ID: "-1002869207745",
    
    // 服务配置
    GITHUB_PAGES_URL: "https://jhk5263.github.io/wecom-edgeone-proxy"
};

// 导出配置
if (typeof module !== 'undefined') {
    module.exports = config;
}
