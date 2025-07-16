import {sortTokenAddresses} from "@/utils/tokenOrder.js";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {ethers} from "ethers";
import { useCallback } from "react";

    let abi = [
            "function ExactOutputSwapSingle(address token0,address token1,uint24 fee,int24 tickSpacing,address hookContract,uint128 amountOut,uint128 maxAmountIn,bool zeroForOne,address poolAdd,address recipient) returns (uint256 amountIn)",
            "function ExactInputSwapSingle(address token0,address token1,uint24 fee,int24 tickSpacing,address hookContract,uint128 amountIn,uint128 minAmountOut,bool zeroForOne,address poolAdd,address recipient) returns (uint256 amountOut)",
            "function approveTokenWithPermit2(address token, uint160 amount, uint48 expiration)"
    ]   

    const usdcAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];
export function useSwap(){

    let {wallets} = useWallets()
    
    let buy = useCallback(
        async(value:BigInt,VPTaddress:string,baseAddress:string,poolAddress:string)=>{



        let [token0, token1] = sortTokenAddresses(VPTaddress, baseAddress);
        if(!wallets || wallets.length === 0){
            throw new Error('No wallet connected')
        }
        let wallet = wallets[0]; // or select preferred wallet
        if(!wallet.getEthereumProvider){
            throw new Error('Wallet does not support getEthereumProvider')
        }
        let privyProvider = await wallet.getEthereumProvider()
        let ethersProvider = new ethers.BrowserProvider(privyProvider);
        let signer = await ethersProvider.getSigner();
        let swapContract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS!,abi,signer)
        let usdcContract = new ethers.Contract(process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS!,usdcAbi,signer)
                    // Approve the swap contract to spend USDC
            let approvePromise = await usdcContract.approve(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS, ethers.MaxUint256);
            let balance = await usdcContract.balanceOf(wallets[0].address);
            console.log("balance",balance)
            await approvePromise.wait();
            //approve token with permit2
            const expiration = Math.floor(Date.now() / 1000) + 3600; // current time + 1 hour
            const MAX_UINT160 = (2n** 160n) - 1n;
            let permit2approvePromise = await swapContract.approveTokenWithPermit2(process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS,MAX_UINT160,expiration);
            await permit2approvePromise.wait();
        if(token0 === baseAddress){

         

        let swapPromise = await swapContract.ExactOutputSwapSingle(token0,token1,3000,60,process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,value,balance,true,poolAddress,wallets[0].address)
        await swapPromise.wait();
        }else{
            console.log("low token buy")
            console.log(token0,token1)
            let swapPromise = await swapContract.ExactOutputSwapSingle(token0,token1,3000,60,process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,value,balance,false,poolAddress,wallets[0].address)
            await swapPromise.wait()
        }
  
    }
,[])

    let sell = useCallback(
        async(value:BigInt,VPTaddress:string,baseAddress:string,poolAddress:string)=>{

        let [token0, token1] = sortTokenAddresses(VPTaddress, baseAddress);
        if(!wallets || wallets.length === 0){
            throw new Error('No wallet connected')
        }
        let wallet = wallets[0]; // or select preferred wallet
        if(!wallet.getEthereumProvider){
            throw new Error('Wallet does not support getEthereumProvider')
        }
        let privyProvider = await wallet.getEthereumProvider()
        let ethersProvider = new ethers.BrowserProvider(privyProvider);
        let signer = await ethersProvider.getSigner();
        let swapContract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS!,abi,signer)
        let vptContract = new ethers.Contract(VPTaddress,usdcAbi,signer)
                    // Approve the swap contract to spend USDC
            let approvePromise = await vptContract.approve(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS, ethers.MaxUint256);
            await approvePromise.wait();
            //approve token with permit2
            const expiration = Math.floor(Date.now() / 1000) + 3600; // current time + 1 hour
            const MAX_UINT160 = (2n** 160n) - 1n;
            let permit2approvePromise = await swapContract.approveTokenWithPermit2(VPTaddress,MAX_UINT160,expiration);
            await permit2approvePromise.wait();
        if(token0 === baseAddress){

            let swapPromise = await swapContract.ExactInputSwapSingle(
            token0,
            token1,
            3000, // fee
            60, // tickSpacing
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookContract
            value, // amountIn
            0, // minAmountOut
            false, // zeroForOne
            poolAddress, // poolAdd
            wallets[0].address // recipient
        )
        await swapPromise.wait();

        }else{
            let swapPromise = await swapContract.ExactInputSwapSingle(
            token0,
            token1,
            3000, // fee
            60, // tickSpacing
            process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS, // hookContract
            value, // amountIn
            0, // minAmountOut
            true, // zeroForOne
            poolAddress, // poolAdd
            wallets[0].address // recipient
        )

        await swapPromise.wait();
        }
    },[])
    return {buy, sell};
}


