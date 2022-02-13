import { useState, useEffect } from "react";
import Spinner from "./Spinner";
import  Chess  from "chess.js";
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
const MainChess = ({socket,username}) =>{
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
    let positions = {
      "a8": "bR",
      "b8": "bN",
      "c8": "bB",
      "d8": "bQ",
      "e8": "bK",
      "f8": "bB",
      "g8": "bN",
      "h8": "bR",
      "a7": "bP",
      "b7": "bP",
      "c7": "bP",
      "d7": "bP",
      "e7": "bP",
      "f7": "bP",
      "g7": "bP",
      "h7": "bP",
      "a2": "wP",
      "b2": "wP",
      "c2": "wP",
      "d2": "wP",
      "e2": "wP",
      "f2": "wP",
      "g2": "wP",
      "h2": "wP",
      "a1": "wR",
      "b1": "wN",
      "c1": "wB",
      "d1": "wQ",
      "e1": "wK",
      "f1": "wB",
      "g1": "wN",
      "h1": "wR"
    }

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
        setTurn(res['white']===socket.id?'w':'b')
        setOrientation(res['black']===socket.id?'black':'white');
        setOtherusername(res['white']===socket.id?res['blackUsername']:res['whiteUsername'])
        setOtherid(res['white']===socket.id?res['black']:res['white'])
        if(res['white']===socket.id) socket.emit('counter',{myid:socket.id, otherid:res['white']===socket.id?res['black']:res['white'], gameid: res['gameid']})
      })
    },[])
  
    useEffect(()=>{
      socket.on('move',({sourceSquare,targetSquare,flag})=>{
        let move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion:'q'
        });
        if (move === null) return;
        if(move.captured){
          if(!flag) {
            game.undo()
            game.remove(move.from)
            toastMixin.fire({
              animation: true,
              title: 'Failed!',
              icon: 'error'
            });
          }else{
            toastMixin.fire({
              animation: true,
              title: 'Success'
            });
          }
        }
        checkGameState();
        setFen(game.fen());
       
      })
    },[])
    useEffect(()=>{
      socket.on('counter',(res)=>{
        setWhiteTimer(res['w'])
        setBlackTimer(res['b'])
      })
    })
    const onDrop = ({sourceSquare, targetSquare}) =>{
        if(game.turn()!==turn){
          return;
        }
        // see if the move is legal
        let move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion:'q'
        });
        if (move === null) return;
        let flag = true
        let threshold = 0
        if(move.captured){
          threshold = probabilities[move.piece.toUpperCase()][move.captured.toUpperCase()]
          if(Math.random() > threshold) flag=false
          if(!flag) {
            game.undo()
            game.remove(move.from)
            toastMixin.fire({
              animation: true,
              title: 'Failed!',
              icon: 'error'
            });
          }else{
            toastMixin.fire({
              animation: true,
              title: 'Success'
            });
          }
        }

        checkGameState();
        setFen(game.fen()); 
        let userturn = game.turn()
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
        console.log(capturedPieces[i])
        commentString += `Statistical chance of ${pieceNames[selectedPiece]} (${fromSquare}) Taking on ${pieceNames[i]} (${capturedPieces[i].join(', ')}) is ${probabilities[selectedPiece][i] * 100}% `
      }
      commentString += ` plus 5.5% avatar advantage`
      setStatisticalComment(commentString)
      console.log(capturedPieces)
    }
    
    const onMouseOutSquare = (square, piece) => {
      removeGreySquares()
    }

    const removeGreySquares = () => {
      // $('.MainChess__inside .square-55d63'). ('background', '')
      let elems = document.querySelectorAll('.grey-square')
      for(let i in elems){
        if(elems[i] instanceof Node)  elems[i].classList.remove('grey-square')
      }
    }
    
    const greySquare = (square) => {
      let elem = document.querySelector(`div[data-squareid="${square}"]`)
      elem.classList.add('grey-square')
    }    

    const getPosition = (currentPosition) => {
      positions = currentPosition
      return currentPosition
    }
    const checkGameState = () =>{
      if(game.game_over()){
        if(game.in_draw()){
          Swal.fire({
            title: "Its a draw",
            icon:'info'
          })
          return;
        }
        if(game.in_stalemate()){
          Swal.fire({
            title: "its a stalemate.",
            icon:'info'
          })
          return;
        }
        if(game.in_threefold_repetition()){
          Swal.fire({
            title: "its a threefold repitition.",
            icon:'info'
          })
          return;
        }
        if(game.insufficient_material()){
          Swal.fire({
            title: "game over due to insufficient material.",
            icon:'info'
          })
          return;
        }
        Swal.fire({
          title: game.turn()==='w'?'black wins':'white wins',
          icon:'success'
        })
      }
    }
  
    return (
      <div className="MainChess__container">
        {!play?<Spinner />:
        <Container fluid>
          <Row style={{height: '100vh'}}>
            <Col className="right-section">
              <Row className="header-section"></Row>
              <Row className="content-section">
                <Col className="comment-section">
                  <span className="comment">{statisticalComment}</span>
                </Col>
              </Row>
            </Col>
            <Col lg={6} md={6} sm={8}>
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
                          getPosition={getPosition}
                          dropSquareStyle={{opacity: '0.9'}}
                          lightSquareStyle={{backgroundImage: 'url(/light.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center center'}}
                          darkSquareStyle={{backgroundImage: 'url(/dark.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center center'}}
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
              <Row className="content-section">
                <Col className="user-list">
                  <div className="avatar" style={{ backgroundImage: "url(/outline.png)" }}>
                    <img className="avatar-png" src="/1.png"></img>
                    <span className="user_info"><span class="fi fi-in"></span>Isekai #121 (5% advantage)</span>
                  </div>
                  <div className="avatar" style={{ backgroundImage: "url(/outline.png)" }}>
                    <img className="avatar-png" src="/2.png"></img>
                    <span className="user_info"><span class="fi fi-us"></span>Isekai #3523 (5,5% advantage)</span>
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