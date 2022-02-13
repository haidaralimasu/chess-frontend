import { useEffect } from "react";
import Swal from "sweetalert2";
import { connectWallet, getCurrentWalletConnected } from './interact'

const MainInput = ({setAddress,address,setUser,socket}) =>{
    const onClickConnectWallet = async () =>{
      const response = await connectWallet()
      if(response.address){
        setAddress(response.address)
        setUser(true);
  
        socket.auth = {address: response.address};
        socket.connect();
      }
    }
    const onClickDisconnect = async () =>{
      setAddress('')
      setUser(false);
    }
    useEffect(()=>{
      socket.on('duplicated',(res)=>{
        socket.close()
        Swal.fire({
          title: "Your wallet address has already logged in!",
          icon:'info'
        })
        setAddress('')
        setUser(false)
      })
    })
    return(
      <div className="MainInput__container">
        {address?
          <button onClick={onClickDisconnect}>{address}</button>
          :
          <button onClick={onClickConnectWallet}>Connect Wallet</button>
        }
      </div>
    );
}

export default MainInput;