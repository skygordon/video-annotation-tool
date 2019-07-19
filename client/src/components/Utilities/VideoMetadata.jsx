import React, { Component } from "react";
import axios from "axios";
import Input from "@material-ui/core/Input";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Radio from "@material-ui/core/Radio";
import { withStyles } from "@material-ui/core/styles";

import Summary from "./Summary.jsx";

const styles = theme => ({
  dialogStyle: {
    width: theme.spacing(50),
    height: theme.spacing(65),
    boxShadow: theme.shadows[5],
    margin: "auto",
    outline: "none"
  }
});

class VideoMetadata extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videoMetadata: null,
      videoStatus: null,
      isLoaded: false,
      descriptionOpen: false,
      summary: null
    };
  }

  componentDidMount = () => {
    const config = {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    axios
      .get("/api/videos/" + this.props.openedVideo.id, config)
      .then(response => {
        //Logic to check video's status from user checkpoints
        let username = localStorage.getItem("username");
        let usersWatching = response.data[0].userswatching;
        let usersFinished = response.data[0].usersfinished;
        let userIndex = usersWatching.indexOf(username);
        let videoStatus = "inProgress";

        if (userIndex === -1) {
          videoStatus = "unwatched";
        } else if (usersFinished[userIndex]) {
          videoStatus = "annotated";
        }
        this.setState({
          videoMetadata: response.data[0],
          videoStatus: videoStatus,
          isLoaded: true
        });
      })
      .catch(error => {
        console.log("Error in VideoMetadata.jsx get /api/videoMetadata/");
        console.log(error);
      });
  };

  handleKeyPress = e => {
    if (e.key === "Enter") {
      this.update();
    } else {
      let videoMetadata = this.state.videoMetadata;
      videoMetadata.description = e.target.value + e.key;
      this.setState({
        videoMetadata: JSON.parse(JSON.stringify(videoMetadata))
      });
    }
  };

  update = () => {
    this.updateVideoDescription();
    this.updateVideoStatus();
    this.props.handleClose();
  };

  updateVideoDescription = () => {
    const body = {
      description: this.state.videoMetadata.description
    };
    const config = {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    axios
      .patch("/api/videos/" + this.props.openedVideo.id, body, config)
      .then(updateRes => {
        console.log(updateRes);
      })
      .catch(error => {
        console.log("Error in VideoMetadata.jsx patch /api/videos");
        console.log(error.response.data);
      });
  };

  updateVideoStatus = () => {
    const config = {
      url: "/api/videos/checkpoints/" + this.props.openedVideo.id,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      data: {
        timeinvideo: this.props.openedVideo.timeinvideo,
        finished: this.state.videoStatus === "annotated" ? true : false
      }
    };
    config.method = this.state.videoStatus === "unwatched" ? "delete" : "put";
    axios
      .request(config)
      .then(res => {
        this.props.loadVideos();
        this.props.socket.emit("refresh videos");
        console.log("Changed: " + res.data.message);
      })
      .catch(error => {
        console.log("Error in /api/videos " + config.method);
        console.log(error);
      });
  };

  openVideoSummary = async event => {
    event.stopPropagation();

    this.setState({
      descriptionOpen: true,
      summary: await this.getSummary()
    });
  };

  closeVideoSummary = () => {
    this.setState({
      descriptionOpen: false,
      summary: null
    });
  };

  getSummary = () => {
    const config = {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    return axios
      .get("/api/videos/summary/" + this.props.openedVideo.id, config)
      .then(summary => {
        return summary;
      })
      .catch(error => {
        console.log("Error in VideoMetadata.jsx patch /api/videos/summary");
        console.log(error.response.data);
      });
  };

  handleVideoStatusChange = event => {
    this.setState({
      videoStatus: event.target.value
    });
  };

  render() {
    const { classes, openedVideo } = this.props;
    const { isLoaded, videoStatus } = this.state;
    if (!isLoaded) {
      return <div>Loading...</div>;
    }
    const {
      filename,
      description,
      gpsstart,
      gpsstop,
      startdepth,
      enddepth,
      starttime,
      endtime,
      userswatching
    } = this.state.videoMetadata;

    return (
      <Dialog
        onClose={this.props.handleClose}
        open={this.props.open}
        aria-labelledby="form-dialog-title"
      >
        <div className={classes.dialogStyle}>
          <DialogTitle id="form-dialog-title">
            <small>
              Video:{openedVideo.id}
              <br />
              {filename}
            </small>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Users Watching: {userswatching.join(", ")}
              <br />
              GPS start: {gpsstart.x + ", " + gpsstart.y}
              <br />
              GPS stop: {gpsstop.x + ", " + gpsstop.y}
              <br />
              Start Depth: {startdepth}
              <br />
              End Depth: {enddepth}
              <br />
              Start Time: {starttime}
              <br />
              End Time: {endtime}
              <br />
            </DialogContentText>
            <br />
            <Input
              onKeyPress={this.handleKeyPress}
              autoFocus
              id="concept"
              type="text"
              defaultValue={description}
              placeholder={"Description"}
              multiline
              disabled={this.props.modelTab}
            />
          </DialogContent>
          <Radio
            checked={videoStatus === "unwatched"}
            onChange={this.handleVideoStatusChange}
            value="unwatched"
            color="default"
            disabled={this.props.modelTab}
          />
          Unwatched
          <Radio
            checked={videoStatus === "annotated"}
            onChange={this.handleVideoStatusChange}
            value="annotated"
            color="default"
            disabled={this.props.modelTab}
          />
          Annotated
          <Radio
            checked={videoStatus === "inProgress"}
            onChange={this.handleVideoStatusChange}
            value="inProgress"
            color="default"
            disabled={this.props.modelTab}
          />
          In Progress
          <DialogActions>
            <Button
              onClick={event => this.openVideoSummary(event)}
              color="primary"
            >
              Summary
            </Button>
            <Button onClick={this.props.handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={this.update}
              color="primary"
              disabled={this.props.modelTab}
            >
              Update
            </Button>
          </DialogActions>
          {this.state.descriptionOpen && (
            <Summary
              open={
                true /* The 'openness' is controlled through
              boolean logic rather than by passing in a variable as an
              attribute. This is to force Summary to unmount when it 
              closes so that its state is reset. This also prevents the 
              accidental double submission bug, by implicitly reducing 
              the transition time of Summary to zero. */
              }
              handleClose={this.closeVideoSummary}
              gpsstart={gpsstart}
              gpsstop={gpsstop}
              startdepth={startdepth}
              enddepth={enddepth}
              summary={this.state.summary}
            />
          )}
        </div>
      </Dialog>
    );
  }
}

export default withStyles(styles)(VideoMetadata);
