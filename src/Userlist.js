import { useState,useEffect } from "react";
import MainChess from "./MainChess";
import Swal from  'sweetalert2'


const Userlist = ({socket,address}) => {
    const [start,setStart] = useState(false);
    const [users, setUsers] = useState([]);
    useEffect(()=>{
      socket.on('list',(res)=>{
        const user = [];
        console.log(res)
        for (var key of Object.keys(res)) {
          if(key!==socket.id){
            let data = {
                id : key,
                address : res[key].address
            }
            user.push(data)
          }
        }
        setUsers(user)
      })
    },[])
  
    useEffect(()=>{
      socket.on('create', ({gameid,id})=>{
        Swal.fire({
          title: "You are being invited",
          icon:'question',
          confirmButtonText:"join"
        }).then(res=>{
          if(res.isConfirmed){
            let myid = socket.id
            socket.emit('join',{gameid,id,myid});
            setStart(true)
          }
        })
      })
    },[])
  
    const startGame = (id) =>{
      socket.emit('create',id);
      setStart(true)
    }
    return(
      <div>
          
          {!start?<div className="userlist"><ul>
            <li className="first">{address}</li>
          {users&&users.map((value,index)=>(
            <li className="user-list-item" key={index}>{value.address} {<button className="play-btn" onClick={()=>startGame(value.id)}>play</button>}</li>
          ))}</ul></div>
          :<MainChess 
          username={address}
          socket={socket}/>}
      </div>
    );
  }

  export default Userlist;