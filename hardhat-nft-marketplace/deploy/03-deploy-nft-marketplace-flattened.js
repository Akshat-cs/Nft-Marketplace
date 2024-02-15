const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    const arguments = []
    const nftMarketplace = await deploy("NFTMarketplace_flattened", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Deployed NFTMarketplace_flattened")
    log("----------------------------------------------------")

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        network.config.chainId == "80001" &&
        process.env.POLYGONSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(nftMarketplace.address, arguments)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "nftmarketplace_flattened", "flattened"]
