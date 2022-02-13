import Swal from "sweetalert2";
import { connectWallet, getCurrentWalletConnected } from './interact'

const MainInput = ({setAddress,address,setUser,socket}) =>{
    const onClickConnectWallet = async () =>{
      const response = await connectWallet()
      setAddress(response.address)

      socket.auth = {address: response.address};
      socket.connect();
      setUser(true);
    }
    const onClickDisconnect = async () =>{
      setAddress('')
    }
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