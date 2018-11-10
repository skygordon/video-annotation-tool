import React, { Component } from 'react';
import Rnd from 'react-rnd';
import axios from 'axios';
// import AWS from 'aws-sdk';

import ConceptsSelected from './ConceptsSelected.jsx';
import VideoList from './VideoList.jsx';
import ErrorModal from './ErrorModal.jsx';
import DialogModal from './DialogModal.jsx';

import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({
  dragBox: {
    margin: '0px',
    backgroundColor: 'transparent',
    border: '2px coral solid',
    borderStyle: 'ridge'
  },
  button: {
    marginTop: '10px',
    marginLeft: '20px',
    marginBottom: '10px'
  }
});

window.addEventListener("beforeunload", (ev) => {
  var myVideo = document.getElementById("video");
  if (!myVideo.paused) {
    ev.preventDefault();
    return ev.returnValue = 'Are you sure you want to close?';
  }
});

class Annotate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      // might want to change this. use function that retrieves last watched video?
      videoName: 'DocRicketts-0569_20131213T224337Z_00-00-01-00TC_h264.mp4',
      errorMsg: null,
      errorOpen: false,
      dialogMsg: null,
      dialogTitle: null,
      dialogPlaceholder: null,
      dialogOpen: false,
      clickedConcept: null,
      closeHandler: null,
      enterEnabled: true,
    };
  }

  getCurrentVideo = async () => {
    let videoData = await axios.get('/api/latestVideoId', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')},
    })
    if (videoData.data.length > 0) { // they've started watching a video
      let videoid = videoData.data[0].videoid;
      let startTime = videoData.data[0].timeinvideo;
      let filename = await axios.get(`/api/latestVideoName/${videoid}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')},
      });
      return {
        filename: filename.data[0].filename,
        time: startTime
      };
    }
    return {
      filename: 'DocRicketts-0569_20131213T224337Z_00-00-01-00TC_h264.mp4',
      time: 0
    };
  };

  componentDidMount = async () => {
    let currentVideo = await this.getCurrentVideo();
    this.setState({
      videoName: currentVideo.filename,
    }, () => {
      var myVideo = document.getElementById("video");
      myVideo.currentTime = currentVideo.time;
    });
  }

  rewind = () => {
     var myVideo = document.getElementById("video");
     var cTime = myVideo.currentTime;
     myVideo.currentTime = (cTime - 5);
  }

  playPause = () => {
    var myVideo = document.getElementById("video");
    if (myVideo.paused) {
      myVideo.play();
    } else {
      myVideo.pause();
    }
  }

  fastForward = () => {
    var myVideo = document.getElementById("video");
    var cTime = myVideo.currentTime;
    myVideo.currentTime = (cTime + 5);
  }

  updateCheckpoint = async (finished) => {
    var myVideo = document.getElementById("video");
    var time = myVideo.currentTime;
    if (localStorage.getItem('token') == null) {
      return;
    }
    if (finished) {
      time = 0;
    }
    if (time > 0 || finished) {
      fetch('/updateCheckpoint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token')},
        body: JSON.stringify({
          'videoId': this.state.videoName,
          'timeinvideo': time,
          'finished' : finished
        })
      }).then(res => res.json())
      .then(res => {
        if (res.message !== "updated") {
          console.log("error");
        }
      })
    }
    // show next video on resume list
    if (finished) {
      fetch('/api/userVideos/false', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')}
      }).then(res => res.json())
      .then(res => {
        if (typeof res.rows[0] !== 'undefined') {
          this.setState({
            videoName: res.rows[0].filename
          }, () => {
            // get saved time from videoid
            fetch(`/api/timeAtVideo/${res.rows[0].id}`, {
              headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')}
            }).then(res => res.json())
            .then(res => {
              if (typeof res.rows !== 'undefined') {
                var myVideo = document.getElementById("video");
                myVideo.currentTime = res.rows[0].timeinvideo;
              }
            })
          });
        }
        else { // no videos on resume list, get from unwatched list
          fetch('/api/userUnwatchedVideos/', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')}
          }).then(res => res.json())
          .then(res => {
            if (typeof res.rows !== 'undefined') {
              this.setState({
                videoName: res.rows[0].filename
              });
            }
          })
        }
      })
    }
  };

  changeSpeed = () => {
    try {
      var myVideo = document.getElementById("video");
      var speed = document.getElementById("playSpeedId").value;
      if ((speed / 100) === 0) {
        myVideo.playbackRate = (1);
      } else {
        myVideo.playbackRate = (speed / 100);
      }
    } catch(err) {
      alert("invalid input");
      myVideo.playbackRate = 1;
    }
  }

  componentWillUnmount = () => {
     this.updateCheckpoint(false);
  }

  getVideoStartTime = async (filename) => {
    let currentTime = await axios.get(`/api/videos/currentTime/${filename}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')},
    })
    return currentTime;
  };

  handleVideoClick = async (filename) => {
    this.setState({
      videoName: filename
    })
    let currentTime = await this.getVideoStartTime(filename);
    if (currentTime.data.length === 1) {
      var myVideo = document.getElementById("video");
      myVideo.currentTime = currentTime.data[0].timeinvideo;
    }
  };

  postAnnotation = (comment, unsure) => {
    var myVideo = document.getElementById("video");
    var cTime = myVideo.currentTime;
    var dragBoxCord = document.getElementById("dragBox").getBoundingClientRect();
    var vidCord = myVideo.getBoundingClientRect("dragBox");
    var x1_video = vidCord.left;
    var y1_video = vidCord.top;

    var x1_box = dragBoxCord.left;
    var y1_box = dragBoxCord.top;
    var height = dragBoxCord.height;
    var width = dragBoxCord.width;

    var x1 = Math.max((x1_box - x1_video),0);
    var y1 = Math.max((y1_box - y1_video),0);
    var x2 = Math.min((x1 + width),1599);
    var y2 = Math.min((y1 + height),899);

    //draw video with and without bounding box to canvas and save as img
    var date = Date.now().toString();
    this.drawImages(vidCord, dragBoxCord, myVideo, date, x1, y1);

    fetch('/annotate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        'conceptId': this.state.clickedConcept.name,
        'videoId': this.state.videoName,
        'timeinvideo': cTime,
        'x1': x1,
        'y1': y1,
        'x2': x2,
        'y2': y2,
        'videoWidth': 1600,
        'videoHeight': 900,
        'image': date,
        'imagewithbox': date + "_box",
        'comment': comment,
        'unsure' : unsure
      })
    }).then(res => res.json()).then(res => {
      if (res.message === "Annotated") {
        this.handleDialogClose();
      } else {
        this.setState({
          errorMsg: res.message,
          errorOpen: true
        });
      }
    });
  }

  drawImages = (vidCord, dragBoxCord, myVideo, date, x1, y1) => {
    var canvas = document.createElement('canvas');
    canvas.height = vidCord.height;
    canvas.width = vidCord.width;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(myVideo, 0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.setAttribute('crossOrigin', 'use-credentials');
    img.src = canvas.toDataURL(1.0);
    this.putVideoImage(img, date, false);
    ctx.lineWidth = "2";
    ctx.strokeStyle = "coral";
    ctx.rect(x1, y1, dragBoxCord.width, dragBoxCord.height);
    ctx.stroke();
    var imgWithBox = new Image();
    imgWithBox.setAttribute('crossOrigin', 'use-credentials');
    imgWithBox.src = canvas.toDataURL(1.0);
    this.putVideoImage(imgWithBox, date, true);
  }

  putVideoImage = async(img, date, box) => {
    let buf = new Buffer(img.src.replace(/^data:image\/\w+;base64,/, ""),'base64');
    fetch('/uploadImage', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        'buf': buf,
        'date': date,
        'box': box,
      })
    }).then(res => res.json())
    .then(res => {
      if(res.message !== "success") {
        console.log("error uploading image to S3")
      }
    });
  }

  handleErrorClose = () => {
    this.setState({ errorOpen: false });
  }

  handleDialogClose = () => {
    this.setState({
      enterEnabled: false,
      dialogOpen: false,
      dialogMsg: null,
      dialogPlaceholder: null,
      dialogTitle: "", //If set to null, raises a warning to the console
      clickedConcept: null,
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <ErrorModal
          errorMsg={this.state.errorMsg}
          open={this.state.errorOpen}
          handleClose={this.handleErrorClose}/>
        <DialogModal
          title={this.state.dialogTitle}
          message={this.state.dialogMsg}
          placeholder={this.state.dialogPlaceholder}
          inputHandler={this.postAnnotation}
          open={this.state.dialogOpen}
          handleClose={this.state.closeHandler}
          enterEnabled={this.state.enterEnabled}
        />
        {this.state.videoName}

        <div>
          <video onPause={this.updateCheckpoint.bind(this, false)} id="video"  width="1600" height="900" src={'api/videos/Y7Ek6tndnA/'+this.state.videoName} type='video/mp4' controls>
            Your browser does not support the video tag.
          </video>
          <Rnd id="dragBox"
            default={{
              x: 30,
              y: 30,
              width: 60,
              height: 60,
          }}
            minWidth={25}
            minHeight={25}
            maxWidth={900}
            maxHeight={650}
            bounds="parent"
            className={classes.dragBox}
          >
          </Rnd>
          <br />
          <Button variant="contained" color="primary" className={classes.button} onClick={this.rewind}>-5 sec</Button>
          <Button variant="contained" color="primary" className={classes.button} onClick={this.playPause}>Play/Pause</Button>
          <Button variant="contained" color="primary" className={classes.button} onClick={this.fastForward}>+5 sec</Button>
          <Button variant="contained" color="primary" className={classes.button} onClick={() => this.updateCheckpoint(true)}>Done</Button>
          <br />
          <span>Play at speed:</span>
          <p><input type="text" id="playSpeedId" placeholder="100" />&ensp; %</p>
          <input type="submit" value="Enter" onClick={this.changeSpeed} />
        </div>
        <ConceptsSelected
          handleConceptClick={this.handleConceptClick}
        />
        <VideoList handleVideoClick={this.handleVideoClick} />
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(Annotate);
