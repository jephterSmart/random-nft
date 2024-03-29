// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "hardhat/console.sol";
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

error RandomIpfsNft__OutOfBound();
error RandomIpfsNft__NotEnoughETH();
error RandomIpfsNft__CouldNotTransfer();

// @title RandomIpfsNft
// @description For building an NFT following the ERC721 token standard.
// This nft enable us achieve:
// 1.) Getting a random nft that is rated
// 2.) Enable Users of this contract to pay for the mintedNft
// 3.) Deployer should be able to withdraw amount payed to contract

contract RandomIpfsNft is VRFConsumerBaseV2, ConfirmedOwner, ERC721URIStorage {
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }
    event RequestSent(uint256 indexed requestId, address requester);
    event NftMinted(uint256 requestId, Breed dogBreed, address dogOwner);

    mapping(uint256 => address) public requestIdToSender;
    VRFCoordinatorV2Interface private immutable i_coordinator;

    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_minMintFee;
    string[] private dogTokenUris;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;
    uint8 public constant MAX_CHANCED_VALUE = 100;

    uint256 public s_tokenCounter;

    /**
     * HARDCODED FOR SEPOLIA
     * COORDINATOR: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
     */
    constructor(
        uint64 subscriptionId,
        address coordinatorAddress,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory _dogTokenUris,
        uint256 minMintFee
    )
        VRFConsumerBaseV2(coordinatorAddress)
        ConfirmedOwner(msg.sender)
        ERC721("Doggie", "DOG")
    {
        i_coordinator = VRFCoordinatorV2Interface(coordinatorAddress);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        dogTokenUris = _dogTokenUris;
        i_minMintFee = minMintFee;
    }

    // Assumes the subscription is funded sufficiently.
    function requestNft() external payable returns (uint256 requestId) {
        if (msg.value == 0) {
            revert RandomIpfsNft__NotEnoughETH();
        }
        if (msg.value < i_minMintFee) {
            console.log("Got here", msg.value);
            revert RandomIpfsNft__NotEnoughETH();
        }
        requestId = i_coordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        requestIdToSender[requestId] = msg.sender;
        emit RequestSent(requestId, msg.sender);

        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(
            requestIdToSender[requestId] != address(0),
            "request not found"
        );

        address nftOwner = requestIdToSender[requestId];
        s_tokenCounter += 1;
        uint8 moddedRng = uint8(_randomWords[0] % MAX_CHANCED_VALUE);
        Breed selectedBreed = getRandomChancedValue(moddedRng);

        _safeMint(nftOwner, s_tokenCounter);

        _setTokenURI(s_tokenCounter, dogTokenUris[uint8(selectedBreed)]);
        emit NftMinted(requestId, selectedBreed, nftOwner);
        console.log(
            "Contract-GOT HERE",
            moddedRng,
            uint8(selectedBreed),
            requestId
        );
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__CouldNotTransfer();
        }
    }

    function getCoordinator()
        external
        view
        returns (VRFCoordinatorV2Interface)
    {
        return i_coordinator;
    }

    function getSubscriptionId() external view returns (uint256) {
        return i_subscriptionId;
    }

    function getGasLane() external view returns (bytes32) {
        return i_gasLane;
    }

    function getCallbackGasLimit() external view returns (uint256) {
        return i_callbackGasLimit;
    }

    function getMinMintFee() external view returns (uint256) {
        return i_minMintFee;
    }

    function getTokenCounter() external view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenUri(uint8 index) external view returns (string memory) {
        return dogTokenUris[index];
    }

    function getRandomChancedValue(
        uint8 moddedRng
    ) public pure returns (Breed) {
        uint8[3] memory chancedArray = getChancedArray();
        uint8 cumulativeCount = 0;
        for (uint8 i = 0; i < uint8(chancedArray.length); i++) {
            if (
                moddedRng >= cumulativeCount &&
                moddedRng < cumulativeCount + chancedArray[i]
            ) {
                return Breed(i);
            }
            cumulativeCount += chancedArray[i];
        }
        revert RandomIpfsNft__OutOfBound();
    }

    function getChancedArray() internal pure returns (uint8[3] memory) {
        return [10, 30, MAX_CHANCED_VALUE - 40];
    }
}
