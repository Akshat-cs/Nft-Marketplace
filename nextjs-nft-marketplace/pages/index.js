import Image from "next/image"
import styles from "../styles/Home.module.css"
import { useMoralis } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import subgraphQueries from "../constants/subgraphQueries"
import GET_ACTIVE_ITEMS from "../constants/subgraphQueries"
import { useQuery } from "@apollo/client"
import NFTBox from "../components/NFTBox"

export default function Home() {
    const { isWeb3Enabled, chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId) : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]
    const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    loading || !listedNfts ? (
                        <div>Loading...</div>
                    ) : (
                        listedNfts.activeItems.map((nft) => {
                            console.log(nft)
                            const { price, nftAddress, seller, tokenId } = nft
                            return (
                                <div>
                                    <NFTBox
                                        price={price}
                                        nftAddress={nftAddress}
                                        marketplaceAddress={marketplaceAddress}
                                        seller={seller}
                                        tokenId={tokenId}
                                        key={`${nftAddress}${tokenId}`}
                                    />
                                </div>
                            )
                        })
                    )
                ) : (
                    <div>Please connect your wallet to see listed NFTs</div>
                )}
            </div>
        </div>
    )
}