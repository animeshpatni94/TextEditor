import React, { useCallback, useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import {io} from 'socket.io-client';
import {useParams, userParams} from 'react-router-dom';
import ImageResize  from 'quill-image-resize-module-react';
import { ImageDrop } from 'quill-image-drop-module'
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageDrop', ImageDrop)

const SAVE_INTERVAL = 2000
const TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],
  
    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
  
    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['image', 'link'],
    ['clean']     
  ]

export default function TextEditor() {
    const {id : documentId} = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s);
       return () => {
        s.disconnect()
       }
    }, [])

    useEffect(() => {
        if (socket == null || quill == null ) return

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })
        socket.emit('get-document', documentId)
    }, [socket, quill, documentId])

    useEffect(() => {
        if (socket == null || quill == null) return 
        const interval = setInterval(() => {
            console.log(quill.getContents())
            socket.emit('save-document', quill.getContents())
        }, SAVE_INTERVAL)
        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return 
        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return 
            socket.emit("send-changes", delta)
        }

        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return 
        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on('receive-changes', handler)

        return () => {
            socket.off('receive-changes', handler)
        }
    }, [socket, quill])

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return
    wrapper.innerHTML = ''
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, { theme: "snow", modules: {toolbar: TOOLBAR_OPTIONS, imageDrop: true, imageResize: {
        parchment: Quill.import('parchment'),
        modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
    }} })
    q.enable(false)
    q.setText('Loading... Please Wait')
    setQuill(q)
  }, [])
  return <div className="container" ref={wrapperRef}></div>
}
