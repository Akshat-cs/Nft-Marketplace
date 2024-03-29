const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    const arguments = []
    const nftMarketplace = await deploy("NftMarketplace", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        network.config.chainId == "11155111" &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(nftMarketplace.address, arguments)
    }
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

module.exports.tags = ["all", "nftmarketplace"]
