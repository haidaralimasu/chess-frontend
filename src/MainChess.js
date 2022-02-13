import { useState, useEffect } from "react";
import Spinner from "./Spinner";
import Chess from 'chess.js';
import Chessboard from "chessboardjsx";
import Swal from  'sweetalert2';
import { Container, Row, Col } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'flag-icons/css/flag-icons.min.css';

const game =new Chess();
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
const MainChess = ({socket,username, oppInfo, avatarInfo, setStart}) =>{
    const [fen, setFen] = useState("start")
    const [play, setPlay] = useState(false);
    const [orientation, setOrientation] = useState('white');
    const [otherusername, setOtherusername] = useState('');
    const [otherid, setOtherid] = useState('');
    const [turn, setTurn] = useState('w');
    const [width,setWidth] = useState(0)
    const [whiteTimer, setWhiteTimer] = useState(0);
    const [blackTimer, setBlackTimer] = useState(0);
    const [statisticalComment, setStatisticalComment] = useState('')
    const [otherInfo, setOtherInfo] = useState(undefined)

    const probabilities = {
      P:{
          Q: 0.5,
          R: 0.75,
          N: 0.76,
          B: 0.75,
          P: 0.85,
          K: 1
      },
      N:{
          Q: 0.6,
          R: 0.7,
          N: 0.8,
          B: 0.8,
          P: 0.85,
          K: 1
      },
      B:{
          Q: 0.6,
          R: 0.7,
          N: 0.8,
          B: 0.8,
          P: 0.85,
          K: 1
      },
      R:{
          Q: 0.7,
          R: 0.8,
          N: 0.8,
          B: 0.8,
          P: 0.85,
          K: 1
      },
      Q:{
          Q: 0.8,
          R: 0.85,
          N: 0.9,
          B: 0.9,
          P: 0.95,
          K: 1
      },
      K:{
          Q: 1,
          R: 1,
          N: 1,
          B: 1,
          P: 1,
          K: 1
      }
    }
    
    const pieceNames = {
      K: 'King',
      Q: 'Queen',
      R: 'Rook',
      N: 'Knight',
      B: 'Bishop',
      P: 'Pawn'
    }
    useEffect(()=>{
      socket.on('join',(res)=>{
        setPlay(true);
        game.reset()
        setFen(game.fen())
        setTurn(res['white']===socket.id?'w':'b')
        setOrientation(res['black']===socket.id?'black':'white');
        setOtherusername(res['white']===socket.id?res['blackUsername']:res['whiteUsername'])
        setOtherid(res['white']===socket.id?res['black']:res['white'])
        if((typeof oppInfo !== "undefined") && (Object.keys(oppInfo).length === 0)) setOtherInfo(res['oppInfo'])
        if(res['white']===socket.id) socket.emit('counter',{myid:socket.id, otherid:res['white']===socket.id?res['black']:res['white'], gameid: res['gameid']})
      });

      socket.on('move', ({sourceSquare,targetSquare,flag})=>{
        let check_flag = game.in_check()
        let move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion:'q'
        });
        
        if (move === null) return;
        let temp_fen = ''
        temp_fen = game.fen()
        if(move.captured){
          if(!flag) {
            if(move.flags !== "e"){
              game.put({type: move.captured.toLowerCase(), color: game.turn()}, move.to)
            } else{
              game.remove(move.to)
              game.put({type: move.captured.toLowerCase(), color: game.turn()}, `${move.to.charAt(0)}${move.from.charAt(1)}`)
            }
            temp_fen = game.fen()

            toastMixin.fire({
              animation: true,
              title: 'Failed!',
              icon: 'error'
            });
            if(check_flag === true){
              setFen(game.fen());
              Swal.fire({
                title: game.turn()==='w'?'white wins':'black wins',
                icon:'success'
              }).then((res) => {
                if (res.isConfirmed) {
                  setStart(false)
                  socket.emit('replay',{id: socket.id, address: username})
                }
              })
              return
            }
          }else{
            toastMixin.fire({
              animation: true,
              title: 'Success'
            });
          }
        }
        
        if(!(!flag&&(move.flags==="e"))) checkGameState();
        game.load(temp_fen)
        setFen(game.fen());
      });

      socket.on('counter',(res)=>{
        setWhiteTimer(res['w'])
        setBlackTimer(res['b'])
      })
      socket.on('exit',(address)=>{
        Swal.fire({
          title: `The Opponent Player(${address}) just exited`,
          icon: 'question',
          confirmButtonText: 'exit',
        }).then((res) => {
          if (res.isConfirmed) {
          setStart(false)
          socket.emit('replay',{id: socket.id, address: username})
        }
        })
      })
      
      if((typeof oppInfo !== "undefined") && (Object.keys(oppInfo).length !== 0)) setOtherInfo(oppInfo)
      
      return () => {
        socket.off('join');
        socket.off('move');
        socket.off('counter');
        socket.off('exit');
      }
    },[])

    const onDrop = ({sourceSquare, targetSquare}) =>{
        if(game.turn()!==turn){
          return;
        }
        // see if the move is legal
        let check_flag = game.in_check()
        let userturn = game.turn()
        let move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion:'q'
        });
        if (move === null) return;
        let flag = true
        let threshold = 0
        let rand = 0
        let temp_fen = ''
        temp_fen = game.fen()
        if(move.captured){
          threshold = probabilities[move.piece.toUpperCase()][move.captured.toUpperCase()]
          if(typeof avatarInfo !== 'undefined') threshold = threshold * 1.05
          rand = Math.random()
          if(rand > threshold) flag=false
          if(!flag) {
            if(move.flags !== "e"){
              game.put({type: move.captured.toLowerCase(), color: game.turn()}, move.to)
            } else{
              game.remove(move.to)
              game.put({type: move.captured.toLowerCase(), color: game.turn()}, `${move.to.charAt(0)}${move.from.charAt(1)}`)
            }
            temp_fen = game.fen()
            toastMixin.fire({
              animation: true,
              title: 'Failed!',
              icon: 'error'
            });
            if(check_flag === true){
              setFen(game.fen());
              socket.emit('move',{sourceSquare, targetSquare, userturn, otherid, flag})
              Swal.fire({
                title: game.turn()==='w'?'white wins':'black wins',
                icon:'success'
              }).then((res) => {
                if (res.isConfirmed) {
                  setStart(false)         
                  socket.emit('replay',{id: socket.id, address: username})                }
                })
              return
            }
          }else{
            toastMixin.fire({
              animation: true,
              title: 'Success'
            });
          }
        }
        
        
        if(!(!flag&&(move.flags==="e"))) checkGameState();
        game.load(temp_fen);
        setFen(game.fen());
        let QR_pieces = document.querySelectorAll('[data-testid^="bR"],[data-testid^="bQ"]')
        if(QR_pieces.length > 0){
          for (let i in QR_pieces){
            QR_pieces.item(i).querySelector('svg g svg g').style.fill = 'rgb(0,0,0)'
            // console.log('----------', QR_pieces.item(i).querySelector('svg g svg g'))
          }
        }
        socket.emit('move',{sourceSquare, targetSquare, userturn, otherid, flag})
    }

    const changeWidth = ({screenWidth}) =>{      
      setWidth(screenWidth/2 - 120)
    }

    const zero = (num)=> num<10?`0${num}`:num
    
    const allowDrag = ({piece, sourceSquare}) => {
      if (game.game_over()) return false
      // or if it's not that side's turn
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
      }
      
      if((game.turn() === 'w' && orientation === 'black') || (game.turn() === 'b' && orientation === 'white')){
        return false
      }
      return true
    }
    
    const onMouseOverSquare = (square) => {
      // get list of possible moves for this square
      var moves = game.moves({
        square: square,
        verbose: true
      })
      setStatisticalComment('')
      // exit if there are no moves available for this square
      if (moves.length === 0) return
      
      // highlight the square they moused over
      greySquare(square)
      
      // highlight the possible squares for this piece
      for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
      }

      let takingMoves = []
      takingMoves = moves.filter((move) => {
        return move.flags === 'c'
      })
      
      if (takingMoves.length === 0) return
      let selectedPiece = takingMoves[0].piece.toUpperCase();
      let fromSquare = takingMoves[0].from.toUpperCase();
      let capturedPieces = {}
      let commentString = ''

      takingMoves.map(move =>{
        let temp = move.captured.toUpperCase()
        if(capturedPieces[temp]) capturedPieces[temp].push(move.to.toUpperCase())
        else capturedPieces[temp] = [move.to.toUpperCase()]
      })
      
      for(let i in capturedPieces){
        commentString += `Statistical chance of ${pieceNames[selectedPiece]} (${fromSquare}) Taking on ${pieceNames[i]} (${capturedPieces[i].join(', ')}) is ${probabilities[selectedPiece][i] * 100}% `
      }
      if(typeof avatarInfo !== 'undefined') commentString += ` plus 5% avatar advantage`
      setStatisticalComment(commentString)
    }
    
    const onMouseOutSquare = (square, piece) => {
      removeGreySquares()
    }

    const removeGreySquares = () => {
      let elems = document.querySelectorAll('.grey-square')
      for(let i in elems){
        if(elems[i] instanceof Node)  elems[i].classList.remove('grey-square')
      }
    }
    
    const greySquare = (square) => {
      let elem = document.querySelector(`div[data-squareid="${square}"]`)
      elem.classList.add('grey-square')
    }    

    const checkGameState = () =>{
      if(game.game_over()){
        if(game.in_draw()){
          Swal.fire({
            title: "Its a draw",
            icon:'info'
          }).then((res) => {
            if (res.isConfirmed) {
              setStart(false)
              socket.emit('replay',{id: socket.id, address: username})
            }
          })
          return
        }
        if(game.in_stalemate()){
          Swal.fire({
            title: "its a stalemate.",
            icon:'info'
          }).then((res) => {
            if (res.isConfirmed) {
              setStart(false)
              socket.emit('replay',{id: socket.id, address: username})
            }
          })
          return
        }
        if(game.in_threefold_repetition()){
          Swal.fire({
            title: "its a threefold repitition.",
            icon:'info'
          }).then((res) => {
            if (res.isConfirmed) {
              setStart(false)
              socket.emit('replay',{id: socket.id, address: username})
            }
          })
          return
        }
        if(game.insufficient_material()){
          Swal.fire({
            title: "game over due to insufficient material.",
            icon:'info'
          }).then((res) => {
            if (res.isConfirmed) {
              setStart(false)
              socket.emit('replay',{id: socket.id, address: username})
            }
          })
          return
        }
        Swal.fire({
          title: game.turn()==='w'?'black wins':'white wins',
          icon:'success'
        }).then((res) => {
          if (res.isConfirmed) {
            setStart(false)
            socket.emit('replay',{id: socket.id, address: username})
          }
          return
        })
      }
      if(game.in_check()){
        toastMixin.fire({
          animation: true,
          title: 'Check!',
          icon: 'warning',
          position: 'center',
          timer: 1000
        })
      }
    }
  
    return (
      <div className="MainChess__container">
        {!play?<Spinner />:
        <Container fluid>
          <Row style={{height: '100vh'}}>
            <Col className="right-section" lg={2} md={3} sm={4}>
              <Row className="header-section"></Row>
              <Row className="content-section">
                <Col className="comment-section">
                  <span className="comment">{statisticalComment}</span>
                </Col>
              </Row>
            </Col>
            <Col lg={8} md={6} sm={4}>
              <Row className="center-header-section">
                <Col style={{padding: '0px', margin: '0px'}}>
                  <div className="header-line"></div>
                  <p className="header-title">Statistical Chess (Isekai Chess)</p>
                </Col>
              </Row>
              <Row className="content-section" style={{padding: '20px 0px'}}>
                <Col>
                  <Row className="timer">
                    <p className="timer-text" style={{backgroundColor: orientation == 'white'? '#292829' : '#DFDFDF', color: orientation == 'white'? '#DFDFDF': '#292829'}}>
                      <i className="fa fa-alarm-clock" style = {{color: orientation == 'white'? '#DFDFDF': '#292829'}}></i>
                      {orientation == 'white'? `${zero(Math.floor(blackTimer/60))}:${zero(blackTimer%60)}`:`${zero(Math.floor(whiteTimer/60))}:${zero(whiteTimer%60)}`}
                    </p>
                  </Row>
                  <Row>
                    <Col lg={1} style={{padding: '0px', width: '20px'}}>
                      <Row style={{width: '100%', height: '50%', backgroundColor: orientation == 'white'? '#292829': '#DFDFDF'}} />
                      <Row style={{width: '100%', height: '50%', backgroundColor: orientation == 'white'? '#DFDFDF': '#292829'}} />
                    </Col>
                    <Col style={{padding: '0px'}}>
                      <div className="MainChess__inside">
                        <Chessboard 
                          position={fen}
                          draggable={true}
                          width={width}
                          calcWidth={changeWidth}
                          orientation={orientation}
                          allowDrag={allowDrag}
                          onDrop={onDrop}
                          onMouseOverSquare={onMouseOverSquare}
                          onMouseOutSquare={onMouseOutSquare}
                          dropSquareStyle={{opacity: '0.9'}}
                          boardStyle={{margin: 'auto'}}
                          lightSquareStyle={{
                            backgroundImage: 'url(/light.png)',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center'
                            }}
                          darkSquareStyle={{
                            backgroundImage: 'url(/dark.png)',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center'
                            }}
                          />
                      </div>
                    </Col>
                  </Row>
                  <Row className="timer">
                    <p className="timer-text" style={{backgroundColor: orientation == 'white'? '#DFDFDF': '#292829', color: orientation == 'white'? '#292829': '#DFDFDF'}}>
                      <i className="fa fa-alarm-clock" style={{color: orientation == 'white'? '#292829': '#DFDFDF'}}></i>
                      {orientation == 'white'? `${zero(Math.floor(whiteTimer/60))}:${zero(whiteTimer%60)}`:`${zero(Math.floor(blackTimer/60))}:${(zero(blackTimer%60))}`}
                    </p>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col className="left-section">
              <Row className="header-section"></Row>
              <Row className="content-section" lg={2} md={3} sm={4}>
                <Col className="user-list">
                  <div className="avatar" style={{ backgroundImage: "url(/outline.png)" }}>
                    {typeof otherInfo === "undefined"?
                      <>
                        <img
                          className="avatar-png"
                          src="/no_avatar.png"
                          alt="No NFT Avatar"
                          title={otherusername}
                          >
                        </img>
                        <span className="user_info"><span className="fi fi-us"></span>No NFT Avatar</span>
                      </>
                    :
                      <>
                        <img
                          className="avatar-png"
                          src={otherInfo.image_thumbnail_url}
                          title={otherusername}
                          >
                        </img>
                        <span className="user_info"><span className="fi fi-in"></span>{otherInfo.name}</span></>
                    }
                  </div>
                  <div className="avatar" style={{ backgroundImage: "url(/outline.png)" }}>
                    {typeof avatarInfo === "undefined"?
                      <>
                        <img
                          className="avatar-png"
                          src="/no_avatar.png"
                          alt="No NFT Avatar"
                          title={username}
                          >
                        </img>
                        <span className="user_info"><span className="fi fi-us"></span>No NFT Avatar</span></>
                      :
                      <>
                        <img
                          className="avatar-png"
                          src={avatarInfo.image_thumbnail_url}
                          title={username}
                          >
                        </img>
                        <span className="user_info"><span className="fi fi-us"></span>{avatarInfo.name}</span></>
                    }
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
        }
      </div>
    );
  }

  export default MainChess;