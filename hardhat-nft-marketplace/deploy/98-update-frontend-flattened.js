const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../nextjs-nft-marketplace/constants/networkMapping.json"
const frontEndAbiFile = "../nextjs-nft-marketplace/constants/"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        await updateContractAdresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace_flattened")
    fs.writeFileSync(
        `${frontEndAbiFile}NFTMarketplace_flattened.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiFile}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAdresses() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace_flattened")
    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["NFTMarketplace_flattened"].includes(
                nftMarketplace.address
            )
        ) {
            contractAddresses[chainId]["NFTMarketplace_flattened"].push(nftMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = { NFTMarketplace_flattened: [nftMarketplace.address] }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend", "flattened", "flattened_frontend"]
