import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ControlLabel, DropdownButton, MenuItem, FormControl, FormGroup, Label, InputGroup, Modal, PageHeader, Row, Col, Glyphicon, Image, HelpBlock, Checkbox } from 'react-bootstrap';
import Decimal from 'decimal.js';

const allowedFileTypes = [
  'image/jpeg',
  'image/jpeg',
  'image/png',
  'image/svg+xml'
];

export default class ChooseImageInputBox extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      fileToUse: null,
      imageFileInfo: null,
      fileValidation: this.validateImageFile(null, null)
    };
  }

  browseForImage() {
    this.fileSelectInput.click();
  }

  onFileSelected(event) {
    let newFileToUse = null;

    const files = event.target.files;
    if (files.length === 1) {
      const chosenFile = files[0];
      const fileSize = chosenFile.size;
      const fileName = chosenFile.name;
      const fileType = chosenFile.type;
      const lastModified = chosenFile.lastModified;

      newFileToUse = {
        fileSize: chosenFile.size,
        fileName: chosenFile.name,
        fileType: chosenFile.type,
        lastModified: chosenFile.lastModified
      };

      // Read this file and get some info about it
      this.getImageFileInfoAsync(chosenFile).then(imageFileInfo => {
        const fileValidation = this.validateImageFile(this.state.fileToUse, imageFileInfo);
        this.setState({
          imageFileInfo: imageFileInfo,
          fileValidation: fileValidation
        });

        const imageChangedMessage = {
          valid : fileValidation.state !== 'error',
          value: imageFileInfo.fileData
        };

        this.props.onImageChanged(imageChangedMessage);
      });
    }

    const fileValidation = this.validateImageFile(this.state.fileToUse, this.state.imageFileInfo);
    this.setState({fileToUse: newFileToUse, fileValidation: fileValidation});
  }

  validateImageFile(file, imageFileInfo) {
    if (!file) {
      return {
        state: null,
        message: 'This is the file which will be in your plot'
      };
    }

    if (allowedFileTypes.indexOf(file.fileType) < 0) {
      // Not allowed file
      return {
        state: 'error',
        message: 'File must be an image type'
      };
    }

    if (file.fileSize > 3000000) {
      const fileSizeInMb = file.fileSize / 1000000;
      return {
        state: 'error',
        message: `File must be less than 3MB (file is ${fileSizeInMb}MB)`
      };
    }

    if (imageFileInfo) {
      const aspectRatio = imageFileInfo.w / imageFileInfo.h;
      const targetRatio = this.props.rectToPurchase.w / this.props.rectToPurchase.h;
      if (Math.abs(aspectRatio - targetRatio) > 0.01) {
        return {
          state: 'warning',
          message: `Selected image does not match the aspect ratio of the target`
        };
      }
    } else {
      return {
        state: 'warning',
        message: 'Processing selected image...'
      };
    }

    return {
      state: 'success',
      message: 'The image looks great!'
    };
  }

  getImageFileInfoAsync(file) {
    return new Promise(function(resolve, reject) {
      const fileReader = new FileReader;
      fileReader.onload = function() {
        this.imagePreview.onload = function () {
          const imageFileInfo = {
            w: this.imagePreview.width,
            h: this.imagePreview.height,
            fileName: file.name,
            fileData: fileReader.result
          };

          resolve(imageFileInfo);
        }.bind(this);

        this.imagePreview.src = fileReader.result;
        this.props.onImageLoaded(fileReader.result);
      }.bind(this);
      
      fileReader.readAsDataURL(file);
    }.bind(this));
  }

  render() {
    const imageLabel = `Plot Image (${this.props.rectToPurchase.w} x ${this.props.rectToPurchase.h})`;

    return (
      <FormGroup controlId='imageSelection' validationState={this.state.fileValidation.state}>
        <ControlLabel>{imageLabel}</ControlLabel>
        <InputGroup>
          <InputGroup.Button>
            <Button onClick={this.browseForImage.bind(this)}>Browse...</Button>
          </InputGroup.Button>
          <FormControl type="text" disabled value={this.state.fileToUse ? this.state.fileToUse.fileName: ''}/>
        </InputGroup>
        <FormControl.Feedback />
        <HelpBlock>{this.state.fileValidation.message}</HelpBlock>
        {/*Add a couple of hidden fields for the input and to gather info about the image */}
        <input accept={allowedFileTypes.join(',')} onChange={this.onFileSelected.bind(this)} type='file' ref={(input) => { this.fileSelectInput = input; }} className='hidden' />
        <img ref={(input) => this.imagePreview = input } className='hidden'/>
      </FormGroup>
    );
  }
}

ChooseImageInputBox.propTypes = {
  rectToPurchase: PropTypes.object.isRequired,
  onImageChanged: PropTypes.func.isRequired
}