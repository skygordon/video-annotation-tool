import React, { Component } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import ConceptsSelected from "./ConceptsSelected.jsx";
import DialogModal from "./DialogModal";
import Rnd from "react-rnd";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  },
  item: {
    display: "inline",
    paddingTop: 0,
    width: "1300px",
    height: "730px",
    paddingLeft: 0
  },
  img: {
    postion: 'absolute',
    top: '50px',
    width: '1600px',
    height: '900px'
  },
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gridGap: `${theme.spacing.unit * 3}px`
  },
  paper: {
    padding: theme.spacing.unit
  },
  dragBox: {
    margin: "0px",
    backgroundColor: "transparent",
    border: "2px coral solid",
    borderStyle: "ridge"
  }
});

class VerifyAnnotations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIndex: this.props.index,
      error: null,
      dialogMsg: null,
      dialogOpen: false,
      clickedConcept: null,
      closeHandler: null,
      x: this.props.annotation.x1,
      y: this.props.annotation.y1,
      width: this.props.annotation.x2-this.props.annotation.x1,
      height: this.props.annotation.y2-this.props.annotation.y1,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.annotation !== this.props.annotation) {
      this.setState({
        x: this.props.annotation.x1,
        y: this.props.annotation.y1,
        width: this.props.annotation.x2-this.props.annotation.x1,
        height: this.props.annotation.y2-this.props.annotation.y1,
      })
    }
  }

  verifyAnnotation = async () => {
    const body = {
      id: this.props.annotation.id
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    return axios
      .patch(`/api/annotationsVerify/`, body, config)
      .then(res => {
        return res.data;
      })
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  nextAnnotation = () => {
    // let nextIndex = this.state.currentIndex + 1;
    // this.setState({
    //   currentIndex: nextIndex,
    //   loaded: false
    // });
    if (this.props.size === this.props.index + 1){
      this.setState({
        end: true
      })
      return
    }
    this.props.handleNext();
  };

  // Concepts Selected
  handleDialogClose = () => {
    this.setState({
      dialogOpen: false,
      dialogMsg: null,
      clickedConcept: null
    });
  };

  handleConceptClick = concept => {
    this.setState({
      dialogMsg:
        "Switch " +
        this.props.annotation +
        " to " +
        concept.name +
        "?",
      dialogOpen: true,
      clickedConcept: concept,
      closeHandler: this.handleDialogClose
    });
  };

  redrawAnnotation = () => {
    var redraw;
    if (this.state.redraw) {
      redraw = false;
    } else {
      redraw = true;
    }
    this.setState({
      redraw: redraw
    });
  };

  /* ALL BOX UPDATE FUNCTIONS */
  postBoxImage = async () => {
    var dragBoxCord = document
      .getElementById("dragBox")
      .getBoundingClientRect();
    var imageElement = document.getElementById("image");
    var imageCord = imageElement.getBoundingClientRect("dragBox");
    var x1_image = imageCord.left;
    var y1_image = imageCord.top;
    var x1_box = dragBoxCord.left;
    var y1_box = dragBoxCord.top;
    var height = dragBoxCord.height;
    var width = dragBoxCord.width;

    var x1 = Math.max(x1_box - x1_image, 0);
    var y1 = Math.max(y1_box - y1_image, 0);
    var x2 = Math.min(x1 + width, 1599);
    var y2 = Math.min(y1 + height, 899);

    console.log(x1, y1, x2, y2);
    await this.updateBox(x1, y1, x2, y2, imageCord, dragBoxCord, imageElement);
  };

  createAndUploadImages = async (
    imageCord,
    dragBoxCord,
    imageElement,
    x1,
    y1
  ) => {
    var canvas = document.createElement("canvas");
    canvas.height = imageCord.height;
    canvas.width = imageCord.width;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.setAttribute("crossOrigin", "use-credentials");
    ctx.lineWidth = "2";
    ctx.strokeStyle = "coral";
    ctx.rect(x1, y1, dragBoxCord.width, dragBoxCord.height);
    ctx.stroke();
    img.src = canvas.toDataURL(1.0);
    await this.uploadImage(img);
  };

  uploadImage = img => {
    let buf = new Buffer(
      img.src.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    const body = {
      buf: buf,
      name: this.props.annotation.imagewithbox
    };
    return axios.post("/api/updateImageBox", body, config);
  };

  updateBox = (x1, y1, x2, y2, imageCord, dragBoxCord, imageElement) => {
    // console.log("Before Update", this.props.annotations[this.state.currentIndex]);
    const body = {
      id: this.props.annotation.id,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    return axios
      .patch(`/api/annotationsUpdateBox/`, body, config)
      .then(res => {
        // console.log(res)
        this.createAndUploadImages(
          imageCord,
          dragBoxCord,
          imageElement,
          x1,
          y1
        );
        if (res.status === 200) {
          this.setState({
            redraw: !this.state.redraw,
            redrawn: true
          });
        }
      })
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  render() {
    const { classes } = this.props;
    var annotation = this.props.annotation;
    console.log(annotation);
    console.log(this.state.x, this.state.y);
    if (!this.state.x) {
      return (
        <div>Loading...</div>
      )
    }
    return (
      <React.Fragment>
        <DialogModal
          title={"Confirm Annotation Edit"}
          message={this.state.dialogMsg}
          placeholder={"Comments"}
          inputHandler={this.editAnnotation}
          open={this.state.dialogOpen}
          handleClose={this.state.closeHandler}
        />
        {!this.state.end ? (
          <React.Fragment>
            <Typography className={classes.paper} variant="title">
              {" "}
              Annotation {annotation.id}
            </Typography>
            <Typography className={classes.paper} variant="body2">
              {" "}
              Annotated by: {annotation.userid}, Video: {annotation.videoid},
              Concept: {annotation.name}
            </Typography>
            <Typography className={classes.paper} variant="body2">
              At {Math.floor(annotation.timeinvideo / 60)} minutes{" "}
              {Math.floor(annotation.timeinvideo % 60)} seconds
            </Typography>
            <ConceptsSelected handleConceptClick={this.handleConceptClick} />
            {!annotation.image ? (
              <Typography className={classes.paper}>No Image</Typography>
            ) : (
              <div>
                {/* {this.state.redraw || this.state.redrawn ? ( */}
                  <div> 
                    <Rnd
                      id="dragBox"
                      className={classes.dragBox}
                      // default={{
                      //   x: annotation.x1,
                      //   y: annotation.y1,
                      //   width: annotation.x2-annotation.x1,
                      //   height: annotation.y2-annotation.y1
                      // }}
                      size={{ width: this.state.width, height: this.state.height }}
                      position={{ x: this.state.x, y: this.state.y }}
                      onDragStop={(e, d) => {
                        this.setState({ x: d.x, y: d.y });
                      }}
                      onResize={(e, direction, ref, delta, position) => {
                        this.setState({
                          width: ref.style.width,
                          height: ref.style.height,
                          ...position
                        });
                      }}
                      minWidth={25}
                      minHeight={25}
                      maxWidth={900}
                      maxHeight={650}
                      bounds="parent"
                    />
                    <img
                      id="image"
                      className={classes.img}
                      src={`/api/annotationImages/${this.props.annotation.id}?withBox=false`}
                      alt="error"
                      crossOrigin="use-credentials"
                    />
                  </div>
                {/* ) : (
                  <img
                    className={classes.img}
                    src={`/api/annotationImages/${annotation.id}?withBox=true`}
                    alt="error"
                  />
                )} */}
              </div>
            )}
            <Typography className={classes.paper}>
              {this.props.index + 1} of {this.props.size}
            </Typography>
            {/* {this.state.redraw ? ( */}
              {/* <div>
                <Button
                  className={classes.button}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    this.postBoxImage();
                  }}
                >
                  Redraw
                </Button>
                <Button
                  className={classes.button}
                  variant="contained"
                  onClick={() => {
                    this.redrawAnnotation();
                  }}
                >
                  Cancel
                </Button>
              </div> */}
            {/* ) : ( */}
              <div>
                <Button
                  className={classes.button}
                  variant="contained"
                  onClick={() => {
                    this.reset(annotation);
                  }}
                >
                  Reset
                </Button>
                <Button
                  className={classes.button}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    this.nextAnnotation();
                    this.postBoxImage();
                    this.verifyAnnotation();
                  }}
                >
                  Verify
                </Button>
                <Button
                  className={classes.button}
                  variant="contained"
                  onClick={this.nextAnnotation}
                >
                  Ignore
                </Button>
              </div>
            {/* )} */}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Typography className={classes.paper}>Finished</Typography>
            <Button
              className={classes.button}
              variant="contained"
              color="primary"
              onClick={this.props.unmountSelection}
            >
              Filter Annotations
            </Button>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

VerifyAnnotations.propTypes = {
  classes: PropTypes.object
};

export default withStyles(styles)(VerifyAnnotations);
