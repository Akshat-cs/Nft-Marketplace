import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { ethers } from "ethers"
import nftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import { useState, useEffect } from "react"

export default function Home() {
    const dispatch = useNotification()
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]
    const [proceeds, setProceeds] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        })
        console.log(`proceeds:${proceeds}`)
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    useEffect(() => {
        setupUI()
    }, [proceeds, account, isWeb3Enabled, chainId])

    async function approveAndList(data) {
        console.log("Approving..")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseEther(data.data[2].inputResult, "ether").toString()

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function handleApproveSuccess(tx, nftAddress, tokenId, price) {
        await tx.wait(1)
        console.log("Ok now time to list")

        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            params: listOptions,
            onSuccess: handleListSuccess,
            onError: (error) => console.log(error),
        })
    }

    async function handleListSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "NFT Listing",
            title: "Successful",
            position: "topR",
        })
    }

    async function handleWithdrawSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Withdrawing Proceeds",
            title: "Successful",
            position: "topR",
        })
    }

    return (
        <div className="styles.container">
            <Form
                onSubmit={approveAndList}
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                        inputWidth: "50%",
                        value: "",
                        key: "nftAddress",
                    },
                    {
                        name: "Token ID",
                        type: "number",
                        inputWidth: "50%",
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Price (in ETH)",
                        type: "number",
                        inputWidth: "50%",
                        value: "",
                        key: "price",
                    },
                ]}
                title="Sell your NFT!"
                id="Main Form"
            />
            <div className="mt-40 mx-4">
                <div className="my-5">
                    Withdraw Proceeds: {ethers.utils.formatUnits(proceeds, "ether")} ETH
                </div>
                {proceeds != "0" ? (
                    <Button
                        onClick={() => {
                            runContractFunction({
                                params: {
                                    abi: nftMarketplaceAbi,
                                    contractAddress: marketplaceAddress,
                                    functionName: "withdrawProceeds",
                                    params: {},
                                },
                                onError: (error) => console.log(error),
                                onSuccess: handleWithdrawSuccess,
                            })
                        }}
                        text="Withdraw"
                        type="button"
                        theme="secondary"
                    />
                ) : (
                    <div>No Proceeds detected</div>
                )}
            </div>
        </div>
    )
}
