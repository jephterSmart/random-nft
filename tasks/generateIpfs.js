const { pinFileToIPFS, pinMetaDataToIPFS } = require("../utils/upload")
const { config } = require("dotenv")
config()
const UPLOAD_TO_PINATA = process.env.UPLOAD_TO_PINATA

task("generateIpfs", "Upload File(s) to pinata server")
    .addParam(
        "imageNames",
        "The image path inside the image folder, separate with comma, to specify multiple files"
    )
    .setAction(async (taskArguments) => {
        const { imageNames } = taskArguments
        const imageNamesArr = imageNames
            .split(",")
            .map((file) => file.replace(/^\s|\s$/g, ""))

        const hashes = await handleTokenUris(imageNamesArr)
        console.log("Here are the hashes:")
        console.log(hashes)
    })

async function handleTokenUris(fileNames) {
    const metadataTemplate = {
        name: "",
        description: "",
        image: "",
        attributes: [
            {
                type: "cuteness",
                value: 100,
            },
        ],
    }

    try {
        const fileResponses = await Promise.all(fileNames.map(pinFileToIPFS))
        const metadataResponses = await Promise.all(
            fileResponses.map(async (response, idx) => {
                let metadata = { ...metadataTemplate }
                metadata.name = fileNames[idx].replace(/\..+$/, "")
                metadata.description = `An Adorable ${metadata.name} pup!`
                metadata.image = `ipfs://${response.IpfsHash}`
                return pinMetaDataToIPFS(metadata, {})
            })
        )
        return metadataResponses.map((res) => res.IpfsHash)
    } catch (err) {
        console.error(err)
    }
    return []
}
