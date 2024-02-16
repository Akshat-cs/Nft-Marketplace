import { useState } from "react"
import { Modal, Input, useNotification } from "web3uikit"
import { useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"

export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
}) {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)
    const [disabled, setDisabled] = useState(false)

    const handleUpdateListingSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh",
            position: "topR",
        })
        setDisabled(false)
        onClose && onClose()
        setPriceToUpdateListingWith("0")
    }

    const handleCancelListingSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "listing canceled",
            title: "Listing canceled - please refresh",
            position: "topR",
        })
        setDisabled(false)
        onClose && onClose()
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    const { runContractFunction: cancelListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "cancelListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    return (
        <>
            <Modal
                cancelText="Cancel listing"
                okText="Update listing"
                isVisible={isVisible}
                isCancelDisabled={disabled}
                isOkDisabled={disabled}
                onCancel={() => {
                    setDisabled(true)
                    cancelListing({
                        onError: (error) => {
                            console.log(error)
                            setDisabled(false)
                        },
                        onSuccess: handleCancelListingSuccess,
                    })
                }}
                onCloseButtonPressed={onClose}
                onOk={() => {
                    setDisabled(true)
                    updateListing({
                        onError: (error) => {
                            console.log(error)
                            setDisabled(false)
                        },
                        onSuccess: handleUpdateListingSuccess,
                    })
                }}
            >
                <Input
                    label="Update listing price in L1 Currency (MATIC)"
                    name="New listing price"
                    type="number"
                    onChange={(event) => {
                        setPriceToUpdateListingWith(event.target.value)
                    }}
                />
            </Modal>
        </>
    )
}
