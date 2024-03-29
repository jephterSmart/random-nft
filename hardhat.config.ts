import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import { config as envConfig } from "dotenv"

envConfig()
import "./tasks/generateIpfs"
const SEPOLIA_URL = process.env.SEPOLIA_URL
const ACCOUNT_PRIVATE_KEY =
    process.env.ACCOUNT_PRIVATE_KEY || "0x334443445355345"
const ETHERSCAN_PRIVATE_KEY = process.env.ETHERSCAN_PRIVATE_KEY || ""
const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_URL,
            accounts: [ACCOUNT_PRIVATE_KEY],
            chainId: 11155111,
        },
    },
    solidity: {
        compilers: [{ version: "0.8.24" }, { version: "0.8.0" }],
    },
    gasReporter: {
        enabled: false,
    },
    mocha: {
        timeout: 400_000,
    },
    etherscan: {
        apiKey: ETHERSCAN_PRIVATE_KEY,
    },
}

export default config
