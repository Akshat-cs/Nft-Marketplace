import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { ethers } from "ethers"
import nftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import { useState, useEffect } from "react"
import ClipLoader from "react-spinners/ClipLoader"

export default function Home() {
    const dispatch = useNotification()
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]
    const [proceeds, setProceeds] = useState("0")
    const [isDisabled, setIsDisabled] = useState(false)
    const [pageRefresh, setPageRefresh] = useState(false)
    const [loaderSubmit, setLoaderSubmit] = useState(false)

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
        setLoaderSubmit(true)
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
                setLoaderSubmit(false)
                setPageRefresh(true)
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
            onError: (error) => {
                console.log(error)
                setLoaderSubmit(false)
                setPageRefresh(true)
            },
        })
    }

    async function handleListSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: " NFT Listing",
            title: "Successful",
            position: "topR",
        })
        setLoaderSubmit(false)
        setPageRefresh(true)
    }

    async function handleWithdrawSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: " Withdrawing Proceeds",
            title: "Successful",
            position: "topR",
        })
        setLoaderSubmit(false)
        setPageRefresh(true)
        setIsDisabled(false)
    }

    return (
        <div className="styles.container">
            <div className="flex justify-center">
                <ClipLoader size={60} color="#2E7DAF" loading={loaderSubmit} />
            </div>
            {pageRefresh ? <div className="mt-4 mx-4">Please refresh the page!</div> : <></>}
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
                        name: "Price (in MATIC)",
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
                    Withdraw Proceeds: {ethers.utils.formatUnits(proceeds, "ether")} MATIC
                </div>
                {proceeds != "0" ? (
                    <Button
                        disabled={isDisabled}
                        onClick={() => {
                            setIsDisabled(true)
                            setLoaderSubmit(true)
                            runContractFunction({
                                params: {
                                    abi: nftMarketplaceAbi,
                                    contractAddress: marketplaceAddress,
                                    functionName: "withdrawProceeds",
                                    params: {},
                                },
                                onError: (error) => {
                                    console.log(error)
                                    setIsDisabled(false)
                                    setPageRefresh(true)
                                },
                                onSuccess: handleWithdrawSuccess,
                            })
                        }}
                        text="Withdraw"
                        type="button"
                        theme="outline"
                    />
                ) : (
                    <div>No Proceeds detected</div>
                )}
            </div>
        </div>
    )
}
