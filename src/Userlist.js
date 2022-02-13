import { useState, useEffect, useMemo } from 'react'
import MainChess from './MainChess'
import Swal from 'sweetalert2'
import { ethers } from 'ethers'
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  ListGroupItem,
} from 'react-bootstrap'
import Spinner from './Spinner'

export const getContract = () => {
  window.ethereum.enable()
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()

  const contractABI = require('./constants/contract.json')
  const contract = new ethers.Contract(
    process.env.REACT_APP_CONTRACT_ADDRESS,
    contractABI,
    signer,
  )
  return contract
}

const Userlist = ({ socket, address, setUser, setAddress }) => {
  const [start, setStart] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tokenInfos, setTokenInfos] = useState({})
  const [tokens, setTokens] = useState([])
  const [oppInfo, setOppInfo] = useState({})
  const [avatarInfo, setAvatarInfo] = useState({})
  
  useEffect(() => {
    socket.on('list', (res) => {
      const user = []
      for (var key of Object.keys(res)) {
        if (key !== socket.id) {
          let data = {
            id: key,
            address: res[key].address,
          }
          user.push(data)
        }
      }
      setUsers(user)
    })
  }, [])

  useEffect(async () => {
    await walletOfOwner()
  }, [])
  useEffect(()=>{
    socket.on('create', ({ gameid, id, otherInfo }) => {
      Swal.fire({
        title: 'You are being invited',
        icon: 'question',
        confirmButtonText: 'join',
      }).then((res) => {
        if (res.isConfirmed) {
          setOppInfo(otherInfo)
          let myid = socket.id
          socket.emit('join', { gameid, id, myid, avatarInfo })
          setStart(true)
        }
      })
    })
  },[avatarInfo])
  useEffect(()=>{
    let avatarItems = document.getElementsByClassName("avatar-item")
    for(let i = 0; i < avatarItems.length; i++){
      avatarItems.item(i).addEventListener('click', (e)=>{
        for(let j = 0; j < avatarItems.length; j++){
          avatarItems.item(j).classList.remove('selected')
        }
        avatarItems.item(i).classList.add('selected')
        setAvatarInfo(tokenInfos[tokens[i]])
        console.log(tokenInfos, tokens, i)
      })
    }
  }, [loading])
  const walletOfOwner = async () => {
    const contract = getContract()
    try {
      let tx = await contract.walletOfOwner(address)
      let temp_token_infos = {}
      let temp_tokens = []
      for (var i in tx) {
        const value = tx[i];
        try {
          temp_tokens.push(value.toNumber())
          let response = await fetch(
            `${process.env.REACT_APP_OPENSEA_API}/asset/${
              process.env.REACT_APP_CONTRACT_ADDRESS
            }/${value.toNumber()}`,
          )
          temp_token_infos[value.toNumber()] = await response.json()
          await new Promise(resolve => setTimeout(resolve, 1100))
        } catch (e) {
          console.log(e)
        }
      }
      setTokens(temp_tokens)
      setTokenInfos(temp_token_infos)
      setLoading(false)
      setAvatarInfo(temp_token_infos[temp_tokens[0]])
    } catch (error) {
      console.log(error)
    }
  }

  const onClickAvatar = () => {

  }

  const startGame = (id) => {
    socket.emit('create', {oppId: id, otherInfo: avatarInfo})
    setStart(true)
  }
  return (
    <div>
      {!start ? (
        <Container>
          <Row style={{paddingTop: '50px'}}>
            <Col md={6} xs={12}>
              <ul className="user-list">
                <li className="first">{address}</li>
                <li>
                  <ul>
                    {users &&
                      users.map((value, index) => (
                        <li className="user-list-item" key={index}>
                          <p className="opponent-address">{value.address}</p>
                          <button
                            className="play-btn"
                            onClick={() => startGame(value.id)}
                            disabled={loading}
                          >
                            play
                          </button>
                        </li>
                      ))}
                  </ul>
                </li>
              </ul>
            </Col>
            <Col md={6} xs={12}>
              {loading ? (
                <Spinner />
              ) : (
                <Row>
                {
                tokens &&
                Object.values(tokenInfos).map((value, index) => {
                  return (
                    <Col md={6} xs={12} key={value.token_id}>
                      <Card onClick={onClickAvatar(value.token_id)} className={index === 0 ? `avatar-item selected`: `avatar-item`}>
                        <Card.Img
                          variant="top"
                          src={value.image_thumbnail_url}
                        ></Card.Img>
                        <Card.Body>
                          <Card.Title>{value.name}</Card.Title>
                          
                        </Card.Body>
                      </Card>
                    </Col>
                  )
                })
                }
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      ) : (
        <MainChess username={address} socket={socket} oppInfo={oppInfo} avatarInfo={avatarInfo} setStart={setStart}/>
      )}
    </div>
  )
}

export default Userlist
