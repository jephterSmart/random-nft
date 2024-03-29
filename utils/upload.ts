import fs from "fs"
import path from "path"
import { config } from "dotenv"
config()
import pinataSDK from "@pinata/sdk"

const JWT = process.env.PINATA_API_KEY
const pinata = new pinataSDK({ pinataJWTKey: JWT })
const BasePath = path.resolve(process.cwd(), "images")

export const pinFileToIPFS = async (imageName: string) => {
    const fullPath = path.join(BasePath, imageName)
    const rs = fs.createReadStream(fullPath)
    return pinata.pinFileToIPFS(rs, { pinataMetadata: { name: imageName } })
}

export const pinMetaDataToIPFS = async (
    metadata: object & { name: string }
) => {
    return pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: { name: metadata.name + "-meta-data" },
    })
}
