import {auth} from './auth.js';

const app = firebase.initializeApp(auth);
const db = firebase.database();

//const datachannel = document.getElementById('datachannel');
//let localDescription = document.getElementById('localSessionDescription');
let btnStart = document.getElementById('btn_start');
let btnStop = document.getElementById('btn_stop');
let btnRight = document.getElementById('btn_right');
let btnLeft = document.getElementById('btn_left');
let btnAhead = document.getElementById('btn_front');
let btnBack = document.getElementById('btn_back');
let stat_disconnected = document.getElementById('status_disconnected');
let stat_connecting = document.getElementById('status_connecting');
let stat_connected = document.getElementById('status_connected');
//let device_input = document.getElementById('device_name');
//let myVideo = document.getElementById("myVideo");
let device_id = "tankor";
let pc;
let dc;
//let datachannel_on = false;
let vision = document.getElementById('remoteVideos')
vision.setAttribute('hidden', 'true');
btnStart.addEventListener('touchend', init)
btnStop.addEventListener('touchend', stopConnection);

btnAhead.addEventListener('touchstart', moveFront);
btnBack.addEventListener('touchstart', moveBack);
btnLeft.addEventListener('touchstart', moveLeft);
btnRight.addEventListener('touchstart', moveRight);

btnAhead.addEventListener('touchend', moveStop);
btnBack.addEventListener('touchend', moveStop);
btnLeft.addEventListener('touchend', moveStop);
btnRight.addEventListener('touchend', moveStop);
/* btnStart.addEventListener('mousedown', init)
btnStop.addEventListener('mousedown', stopConnection);

btnAhead.addEventListener('mousedown', moveFront);
btnBack.addEventListener('mousedown', moveBack);
btnLeft.addEventListener('mousedown', moveLeft);
btnRight.addEventListener('mousedown', moveRight);

btnAhead.addEventListener('mouseup', moveStop);
btnBack.addEventListener('mouseup', moveStop);
btnLeft.addEventListener('mouseup', moveStop);
btnRight.addEventListener('mouseup', moveStop); */

clearNegotiation()
status_disconnected();



function init() {
  //device_id = device_input.innerText;
  info(device_id);
  vision.removeAttribute('hidden');
  //device_input.setAttribute('hidden', 'true');
  //pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
  pc = new RTCPeerConnection({
    iceServers: [{
      urls: "stun:fr-turn1.xirsys.com",
      username: "23Xgr3XVCOk2GqoZW5eWhbdXM1EfA8VcC6OVVacJSpFdoljTUOsTcgAoFUvfN4vcAAAAAGNFN29nd296ZHlrMg==",
      credential: "2ed490ce-4947-11ed-bd3d-0242ac120004" 
    }]}
  );
  pc.addTransceiver('video', {'direction': 'recvonly'});
  create_datachannel('LINK');


/*   pc.ontrack = function (event) {
    myVideo.srcObject = event.streams[0]
    myVideo.autoplay = true
    myVideo.controls = true
    //myVideo.style.width = "100%"
    //myVideo.style.height = "100%"
  }; */

  pc.ontrack = function (event) {
    var el = document.createElement(event.track.kind)
    el.srcObject = event.streams[0]
    el.autoplay = true
    el.controls = true
    el.style.width = "100%"
    el.style.height = "100%"
    vision.appendChild(el)
  };
  
  pc.oniceconnectionstatechange = function (event) {
    info(pc.iceConnectionState)
    if (pc.iceConnectionState == 'checking') {
      status_connecting();
    } else if (pc.iceConnectionState == 'connected') {
      status_connected();
    } else if (pc.iceConnectionState == 'completed') {
      status_connected();
    } else {
      status_disconnected();
    }
  };

  pc.onicecandidate = function (event) {
    if (event.candidate === null) {
      let lsd = btoa(JSON.stringify(pc.localDescription));
      info("[OFFER]: ok");
      //db_write(device_id, "answer", "");
      db_write(device_id, "offer", lsd);
      info("[ANSWER]: waiting");
      wait_answer();
    }
  };
  
  pc.onnegotiationneeded = function (event) {
    pc.createOffer().then(d => pc.setLocalDescription(d)).catch(info);
  };
};
  
function create_datachannel(channel_name) {
  dc = pc.createDataChannel(channel_name);
  
  dc.onclose = () => {
    //datachannel_on = false;
    info('link has closed');
  };

  dc.onopen = () => {
    //datachannel_on = true;
    info('link has opened');
  };

  dc.onmessage = e => {
    let data = `'${dc.label}': '${e.data}'`;
    info(`'${dc.label}': '${e.data}'`);
    show_data(data);
  };
};

function show_data(data) {
  info(data);
};

function send_data(data) {
  //if (datachannel_on) {
  dc.send(data);
  show_data(data);
  //}
}

function db_read() {
  let dbRef = db.ref().child("signaling").child("welcome")
  .get().then((snapshoot) => {
    if (snapshoot.exists()) {
      info(snapshoot.val());
    } else {
      info("empty snapshoot");
    }
  });
};

function db_write(device, msg_type, data) {
  db.ref().child("signaling").child(device).child(msg_type)
    .set(data);
};

function info(text) {
  console.log(text)
  //messages.innerHTML = messages.innerHTML + text + '<br />';
};

function clearNegotiation() {
  db_write(device_id, "answer", "");
  db_write(device_id, "offer", "");
}

function wait_answer() {
  let on_answer = db.ref().child("signaling").child(device_id).child("answer");
  on_answer.on('value', (snapshot) => {
    set_remote_sdp(snapshot.val());
  });
};

function set_remote_sdp(data) {
  if (data == "") {
    info("empty answer");
    return;
  } else {
    try {
      let sdp = JSON.parse(atob(data));
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
      info("[ANSWER]: ok");
      db_write(device_id, "answer", "");
      btnStop.removeAttribute('hidden')
      btnStart.setAttribute('hidden', 'true')
    } catch (e) {
      alert(e);
    }
  }
};

function moveFront() {
  send_data("front");
};

function moveBack() {
  send_data("back");
};

function moveLeft() {
  send_data("left");
};

function moveRight() {
  send_data("right");
};

function moveStop() {
  send_data("stop");
};

function stopConnection() {
  //dc.close();
  clearNegotiation();
  vision.removeChild(vision.lastChild);
  pc.close();
  btnStop.setAttribute('hidden', 'true');
  btnStart.removeAttribute('hidden');
  //device_input.removeAttribute('hidden');
  vision.setAttribute('hidden', 'true');
  status_disconnected();
};
  
function hide_status_flags() {
  stat_disconnected.setAttribute('hidden', 'true');
  stat_connecting.setAttribute('hidden', 'true');
  stat_connected.setAttribute('hidden', 'true');
};

function status_disconnected() {
  hide_status_flags();
  stat_disconnected.removeAttribute('hidden');
};

function status_connecting() {
  hide_status_flags();
  stat_connecting.removeAttribute('hidden');
};

function status_connected() {
  hide_status_flags();
  stat_connected.removeAttribute('hidden');
};