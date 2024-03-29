import { developmentNetwork } from "../../utils/hardhat-config"
import { network, ethers, ignition } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect, assert } from "chai"
import RandomIpfsNftModule from "../../ignition/modules/RandomIpfsNft"
import Parameters from "../../ignition/parameters.json"

!developmentNetwork.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Tests", function () {
          const minMintFee = "10000000000000000"
          async function deployNftModuleFixture() {
              const accounts = await ethers.getSigners()
              const deployer = accounts[0]
              const { randomIpfsNft, vrfCoordinatorV2Mock } =
                  await ignition.deploy(RandomIpfsNftModule, {
                      parameters: Parameters,
                  })
              return {
                  randomIpfsNft,
                  vrfCoordinatorV2Mock,
                  deployer,
              }
          }

          describe("Constructor", () => {
              it("Initializes the NFT Correctly.", async () => {
                  const { randomIpfsNft, vrfCoordinatorV2Mock } =
                      await loadFixture(deployNftModuleFixture)
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const vrfAddress = await randomIpfsNft.getCoordinator()
                  //   const subId = await randomIpfsNft.getSubscriptionId()
                  const mintFee = await randomIpfsNft.getMinMintFee()

                  expect(name).to.equal("Doggie")
                  expect(symbol).to.equal("DOG")
                  expect(tokenCounter.toString()).to.equal("0")
                  expect(vrfCoordinatorV2Mock).to.equal(vrfAddress)
                  expect(mintFee).to.equal(minMintFee)
              })
          })
          describe("requestNft", () => {
              it("fails if payment isn't sent with the request", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  await expect(randomIpfsNft.requestNft()).to.be.reverted
              })
              it("reverts if payment amount is less than the mint fee", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  const fee: bigint = await randomIpfsNft.getMinMintFee()

                  await expect(
                      randomIpfsNft.requestNft({
                          value: fee - ethers.parseEther("0.001"),
                      })
                  ).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NotEnoughETH"
                  )
              })
              it("emits an event and kicks off a random word request", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  const fee = await randomIpfsNft.getMinMintFee()
                  await expect(
                      randomIpfsNft.requestNft({ value: fee.toString() })
                  ).to.emit(randomIpfsNft, "RequestSent")
              })
          })
          describe("getRandomChancedValue", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  const expectedValue =
                      await randomIpfsNft.getRandomChancedValue(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  const expectedValue =
                      await randomIpfsNft.getRandomChancedValue(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  const expectedValue =
                      await randomIpfsNft.getRandomChancedValue(77)
                  assert.equal(2, expectedValue)
              })
              it("should revert if moddedRng > 99", async function () {
                  const { randomIpfsNft } = await loadFixture(
                      deployNftModuleFixture
                  )
                  await expect(
                      randomIpfsNft.getRandomChancedValue(100)
                  ).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__OutOfBound"
                  )
              })
          })
          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  const { randomIpfsNft, deployer, vrfCoordinatorV2Mock } =
                      await loadFixture(deployNftModuleFixture)
                  await new Promise(async (resolve, reject) => {
                      setTimeout(() => resolve(undefined), 350_000)
                      randomIpfsNft.once(
                          "NftMinted",
                          async (tokenId, breed, minter) => {
                              console.log("GOT HERE")
                              try {
                                  const tokenUri = await randomIpfsNft.tokenURI(
                                      tokenId.toString()
                                  )
                                  const tokenCounter =
                                      await randomIpfsNft.getTokenCounter()
                                  const dogUri =
                                      await randomIpfsNft.getTokenUri(
                                          breed.toString()
                                      )
                                  assert.equal(
                                      tokenUri.toString().includes("ipfs://"),
                                      true
                                  )
                                  assert.equal(
                                      dogUri.toString(),
                                      tokenUri.toString()
                                  )
                                  assert.equal(
                                      +tokenCounter.toString(),
                                      +tokenId.toString()
                                  )
                                  assert.equal(minter, deployer.address)
                                  resolve(dogUri)
                              } catch (e) {
                                  console.log(e)
                                  reject(e)
                              }
                          }
                      )
                      try {
                          const fee = await randomIpfsNft.getMinMintFee()
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: fee.toString(),
                              })
                          const requestNftReceipt =
                              await requestNftResponse.wait(1)

                          const resp =
                              await vrfCoordinatorV2Mock.fulfillRandomWords(
                                  requestNftReceipt.logs[1].args.requestId.toString(),
                                  randomIpfsNft.target
                              )
                          await resp.wait(1)
                          console.log(
                              requestNftReceipt.logs[1].args.requestId,
                              randomIpfsNft.target
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
      })
