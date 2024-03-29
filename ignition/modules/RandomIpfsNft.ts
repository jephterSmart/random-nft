import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers, network } from "hardhat"
import { developmentNetwork } from "../../utils/hardhat-config"
import VRFCoordinatorV2MockModule from "./VRFCoordinatorV2Mock"

const FUND_AMOUNT = ethers.parseUnits("5", "ether")
const RandomIpfsNftModule = buildModule("RandomIpfsNftModule", (m) => {
    const { vrfCoordinatorV2Mock } = m.useModule(VRFCoordinatorV2MockModule)

    const coordinatorAddress = developmentNetwork.includes(network.name)
        ? vrfCoordinatorV2Mock
        : m.getParameter("coordinatorAddress")
    let subscriptionId: any = m.getParameter("subscriptionId") as any

    if (developmentNetwork.includes(network.name)) {
        const subscription = m.call(
            vrfCoordinatorV2Mock,
            "createSubscription",
            []
        )
        const value = m.readEventArgument(
            subscription,
            "SubscriptionCreated",
            0
        )
        subscriptionId = value
        m.call(vrfCoordinatorV2Mock, "fundSubscription", [
            subscriptionId,
            FUND_AMOUNT,
        ])
    }

    const gasLane = m.getParameter("gasLane")
    const callbackGasLimit = m.getParameter("callbackGasLimit")
    const dogTokenUris = m.getParameter("dogTokenUris")
    const minMintFee = m.getParameter("minMintFee")

    const args: any = [
        subscriptionId,
        coordinatorAddress,
        gasLane,
        callbackGasLimit,
        dogTokenUris,
        minMintFee,
    ]

    const randomIpfsNft = m.contract("RandomIpfsNft", args)
    m.call(vrfCoordinatorV2Mock, "addConsumer", [subscriptionId, randomIpfsNft])

    return { randomIpfsNft, vrfCoordinatorV2Mock }
})

export default RandomIpfsNftModule
