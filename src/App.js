import './style.css'
import { useState } from 'react';
import MainInput from './MainInput';
import Userlist from './Userlist';

function App({socket}) {
  const [user, setUser] = useState(false);
  const [address, setAddress] = useState("")
  return (
    <div>
      {user?
      <Userlist
      setUser={setUser}
      setAddress={setAddress} 
      socket={socket}
      address={address}/>
      :
      <MainInput
      setUser={setUser}
      setAddress={setAddress} 
      address={address}
      socket={socket}/>}
    </div>
  );
}

export default App;
