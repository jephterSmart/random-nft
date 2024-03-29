import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat"

const BASE_FEE = "100000000000000000" //ethers.parseUnits("0.35", "ether")
const GAS_PRICE_LINK = "1000000000"

const VRFCoordinatorV2MockModule = buildModule(
    "VRFCoordinatorV2MockModule",
    (m) => {
        const vrfCoordinatorV2Mock = m.contract("VRFCoordinatorV2Mock", [
            BASE_FEE,
            GAS_PRICE_LINK,
        ])

        return { vrfCoordinatorV2Mock }
    }
)

export default VRFCoordinatorV2MockModule
