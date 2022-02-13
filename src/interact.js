import React from "react"
import {ethers} from "ethers"
import Swal from  'sweetalert2';

const toastMixin = Swal.mixin({
    toast: true,
    icon: 'success',
    title: 'General Title',
    animation: false,
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

export const connectWallet = async () => {
  const chainId = process.env.REACT_APP_CHAINID

  if (window.ethereum) {
    try {
      const chain = await window.ethereum.request({ method: "eth_chainId" })
      if (parseInt(chain, 16) == chainId) {
        const addressArray = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        if (addressArray.length > 0) {
            toastMixin.fire({
                animation: true,
                title: '👆🏽 Your wallet is connected to the site.',
                });
          return {
            address: addressArray[0],
            status: "👆🏽 Your wallet is connected to the site.",
          }
        } else {
            toastMixin.fire({
                animation: true,
                title: '😥 Connect your wallet account to the site.',
                icon: 'error'
                });
          return {
            address: "",
            status: "😥 Connect your wallet account to the site.",
          }
        }
      } else {
        window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainId }],
        })
        toastMixin.fire({
            animation: true,
            title: 'Switch your wallet chain into the proper one.',
            icon: 'error'
            });
        return {
          address: "",
          status: "Switch your wallet chain into the proper one.",
        }
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      }
    }
  } else {
    toastMixin.fire({
        animation: true,
        title: '🦊 You must install Metamask, a virtual Ethereum wallet, in your browser.(https://metamask.io/download.html)',
        icon: 'error'
        });
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            {/* <a target="_blank" href={`https://metamask.io/download.html`}> */}
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.(https://metamask.io/download.html)
            {/* </a> */}
          </p>
        </span>
      ),
    }
  }
}

export const getCurrentWalletConnected = async () => {
  const chainId = process.env.REACT_APP_CHAINID

  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      })
      const chain = await window.ethereum.request({
        method: "eth_chainId",
      })
      if (addressArray.length > 0 && chain === chainId) {
        toastMixin.fire({
            animation: true,
            title: '👆🏽 You can play the chess now.',
            });
        return {
          address: addressArray[0],
          status: "👆🏽 You can play the chess now.",
        }
      } else {
        toastMixin.fire({
            animation: true,
            title: '🦊 Connect to Metamask and choose the correct chain using the Connect Wallet button.',
            icon: 'error'
            });
        return {
          address: "",
          status:
            "🦊 Connect to Metamask and choose the correct chain using the Connect Wallet button.",
        }
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      }
    }
  } else {
    toastMixin.fire({
        animation: true,
        title: '🦊 You must install Metamask, a virtual Ethereum wallet, in your browser.(https://metamask.io/download.html)',
        icon: 'error'
        });
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            {/* <a target="_blank" href={`https://metamask.io/download.html`}> */}
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.(https://metamask.io/download.html)
            {/* </a> */}
          </p>
        </span>
      ),
    }
  }
}
