import {sortTokenAddresses} from "@/utils/tokenOrder.js";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {ethers} from "ethers";
import { useCallback } from "react";

    let abi = [
            "function ExactInputSwapSingle(PoolKey calldata key,uint128 amountIn,uint128 minAmountOut,bool zeroForOne,bytes hookData,address recipient) nonReentrant returns (uint256 amountOut)",
            "function ExactOutputSwapSingle(PoolKey calldata key,uint128 amountOut,uint128 maxAmountIn,bool zeroForOne,bytes hookData,address recipient) nonReentrant returns (uint256 amountIn)"
    ]   
export function useSwap(){

    let {wallets} = useWallets()
    
    let buy = useCallback(
        async(value:number,VPTaddress:string,baseAddress:string)=>{



        let [token0, token1] = sortTokenAddresses(VPTaddress, baseAddress);
        let poolKey = {
            currency0: token0,
            currency1: token1,
            fee:3000,
            tickSpacing:60,
            hookContract: process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,
        }
        if(!wallets || wallets.length === 0){
            throw new Error('No wallet connected')
        }
        let wallet = wallets[0]; // or select preferred wallet
        if(!wallet.getEthereumProvider){
            throw new Error('Wallet does not support getEthereumProvider')
        }
        let privyProvider = wallet.getEthereumProvider()
        let ethersProvider = new ethers.BrowserProvider(privyProvider);
        let signer = ethersProvider.getSigner();
        let swapContract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS,abi,signer)
        if(token0 === baseAddress){
            let swapPromise = await swapContract.exactOutputSwapSingle(
            poolKey,
            ethers.parseUnits(value.toString(), 18), // Assuming value is in 18 decimals
            0, // maxAmountIn
            true, // zeroForOne
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookData
            wallets[0].address // recipient
        )
        await swapPromise.wait();
        }else{
            let swapPromise = await swapContract.ExactInputSwapSingle(
            poolKey,
            ethers.parseUnits(value.toString(), 18), // Assuming value is in 18 decimals
            0, // minAmountOut
            false, // zeroForOne
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookData
            wallets[0].address // recipient
        )
        await swapPromise.wait();
        }
  
    }
,[])

    let sell = useCallback(
        async(value:number,VPTaddress:string,baseAddress:string)=>{

        let [token0, token1] = sortTokenAddresses(VPTaddress, baseAddress);
        let poolKey = {
            currency0: token0,
            currency1: token1,
            fee:3000,
            tickSpacing:60,
            hookContract: process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,
        }
        if(!wallets || wallets.length === 0){
            throw new Error('No wallet connected')
        }
        let wallet = wallets[0]; // or select preferred wallet
        if(!wallet.getEthereumProvider){
            throw new Error('Wallet does not support getEthereumProvider')
        }
        let privyProvider = wallet.getEthereumProvider()
        let ethersProvider = new ethers.BrowserProvider(privyProvider);
        let signer = ethersProvider.getSigner();
        let swapContract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS,abi,signer)
        if(token0 === baseAddress){

            let swapPromise = await swapContract.exactOutputSwapSingle(
            poolKey,
            ethers.parseUnits(value.toString(), 18), // Assuming value is in 18 decimals
            0, // maxAmountIn
            false, // zeroForOne
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookData
            wallets[0].address // recipient
        )
        await swapPromise.wait();

        }else{
            let swapPromise = await swapContract.ExactInputSwapSingle(
            poolKey,
            ethers.parseUnits(value.toString(), 18), // Assuming value is in 18 decimals
            0, // minAmountOut
            true, // zeroForOne
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookData
            wallets[0].address // recipient
        )

        await swapPromise.wait();
        }
    },[])
    return {buy, sell};
}