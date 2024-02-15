const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const PRICE = ethers.utils.parseEther("0.1")

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace_flattened")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Approving NFT for marketplace...")

    const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log("Listing NFT on marketplace...")
    const listTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    const listTxReceipt = await listTx.wait(1)
    console.log("Listed...")

    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
