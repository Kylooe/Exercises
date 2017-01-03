var canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    bg = document.getElementById("bg");



class Player {
    constructor() {
    /*    const defaultOption = {
            div: document.querySelector('.v-player'),
            autoplay: false,
            volume: 0.5,
            playMode: 'order',
            visualEffect: 'normal'
        };
        for (let key in defaultOption) {
            if (!option.hasOwnProperty(key)) {
                option[key] = defaultOption[key];
            }
        }*/

        //this.context = canvas.getContext("2d"),
        this.audioContext = null;
        this.audio = new Audio();
        this.list = [];
        this.shuffledList = [];
        this.order = -1;
        this.currentOrder = 0;
        this.playing = false;
        this.time = null;
        this.volume = 0.5;
        this.playMode = "order";
        this.animation = null;
        this.visualiseMode = "normal";
        this.radius = 0;
        this.icon = {
            play: '<i class="iconfontyyy icon-play" aria-hidden="true"></i>',
            pause: '<i class="iconfontyyy icon-pause" aria-hidden="true"></i>',
            mode: [
                '<i class="iconfontyyy icon-order" aria-hidden="true"></i>',
                '<i class="iconfontyyy icon-circulation" aria-hidden="true"></i>',
                '<i class="iconfontyyy icon-random" aria-hidden="true"></i>',
                '<i class="iconfontyyy icon-sigle" aria-hidden="true"></i>'
            ],
            vol: '<i class="iconfontyyy icon-volume" aria-hidden="true"></i>',
            mute: '<i class="iconfontyyy icon-mute" aria-hidden="true"></i>'
        };

    }

    prepareAPI() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
        try {
            this.audioContext = new AudioContext();
            this.init();
        } catch(err) {
            alert("你的浏览器不支持Web Audio API");
            console.log(err);
        }
        console.log(this.audioContext.sampleRate);
    }

    init() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        bg.height = window.innerHeight;
        this.radius = canvas.height/3;
        context.save();
        this.visualiseMode==="normal" ? context.translate(0,0) : context.translate(canvas.width/2, canvas.height/2);
    }

    controller() {
        const controller = document.getElementById('controller');
        
        const [mode, pre, pause, next, vol] = controller.querySelectorAll('a');

        // 播放模式控制
        let m = 0;
        const playMode = ['order', 'circulation', 'random', 'single'];
        mode.addEventListener('click', () => {
            m = (m===3) ? 0 : m+1;
            mode.innerHTML = this.icon.mode[m];
            this.playMode = playMode[m];
        }, false);


        // 音乐控制
        pause.addEventListener('click', () => {
            if(this.playing) {
                if(this.audio.paused) {
                    this.play(this.audio);
                }else {
                    this.audio.pause();
                    clearInterval(this.time);
                }
                pause.innerHTML = this.audio.paused ? this.icon.play : this.icon.pause;
            }
        }, false);

        const trackRestart = (file) => {
            this.audio.pause();
            this.audio = null;
            clearInterval(this.time);
            cancelAnimationFrame(this.animation);
            this.audio = new Audio();
            this.loadAudio(file.src);
            document.querySelector('h1').innerHTML = file.name;
            pause.innerHTML = this.icon.pause;
        };

        const shuffle = () => {
            if(this.shuffledList.length===0) {
                for(let i=this.order; i>=0; i--) {
                    this.shuffledList[i] = i;
                }
            }
            let randomOrder = Math.floor(Math.random()*this.shuffledList.length),
                order = this.shuffledList.splice(randomOrder,1);
            return order;
        };

        // 下一曲目
        const then = () => {
            if(this.playMode==='random') {
                this.currentOrder = shuffle();
            }else if(this.playMode==='order'&&this.currentOrder===this.order){
                return;
            }else {
                this.currentOrder = (this.currentOrder===this.order) ? 0 : ++this.currentOrder;
            }
            trackRestart(this.list[this.currentOrder]);
        };

        pre.addEventListener('click', () => {
            if(this.playMode==='random') {
                this.currentOrder = shuffle();
            }else if(this.playMode==='order'&&this.currentOrder===0){
                return;
            }else {
                this.currentOrder = (this.currentOrder===0) ? this.order : --this.currentOrder;
            }
            trackRestart(this.list[this.currentOrder]); 
        }, false);

        next.addEventListener('click', () => {
            then();
        }, false);


        //音量控制
        const volumeBar = controller.querySelector('input.volume'), 
              volumeBtn = controller.querySelector('a.volume');
        volumeBar.addEventListener('input', () => {
            if(this.audio.volume===0) volumeBtn.innerHTML = this.icon.vol;
            this.volume = volumeBar.value/10;
            this.audio.volume = this.volume;
        }, false);

        volumeBtn.addEventListener('click', () => {
            if(this.audio.volume) {
                volumeBtn.innerHTML = this.icon.mute;
                this.volume = 0;
            }else {
                volumeBtn.innerHTML = this.icon.vol;
                this.volume = volumeBar.value/10;
            }
            this.audio.volume = this.volume;
             /*   volumeBtn.innerHTML = (this.audio.muted) ? this.icon.vol : this.icon.mute;
                this.audio.volume = (this.audio.muted) ? this.volume : 0;*/
        }, false);


        // 时间进度条
        const playedBar = document.querySelector('.played-bar');
        playedBar.addEventListener('input', () => {
            this.audio.currentTime = parseFloat(playedBar.value) / 1000 * this.audio.duration;
        }, false);


        // 选择背景
        const image = controller.querySelector('.image');
        image.addEventListener('change', function() {
            let file = this.files[0],
                fr = new FileReader();
            window.innerHeight<window.innerWidth ? bg.width = window.innerWidth : bg.height = window.innerHeight;
            fr.onload = () => {
                bg.src = fr.result;
            };
            if(file) {
                fr.readAsDataURL(file);
            }
        }, false);


        // 选择本地音乐
        const music = controller.querySelector('.music'),
              playList = controller.querySelector('.play-list ul');
        music.addEventListener('change', () => {
            if(music.files.length !== 0) {
                for(let f of music.files) {
                    let name = f.name.replace(/\.(?:mp3|ogg|mp4|wav)$/i, '');
                    this.list[++this.order] = {
                        src: f,
                        name: name
                    };
                    playList.innerHTML += `<li>${name}</li>`;
                //    this.order++;
                    if(!this.playing) {
                        this.loadAudio(f);
                        document.querySelector('h1').innerHTML = name;
                    }
                }
            }
        }, false);

        // 曲目选择
        let tracks = playList.getElementsByTagName('li');
        playList.addEventListener('click', (e) => {
            let target = e.target;
            for(let i=tracks.length; i>=0; i--) {
                if(target===tracks[i]) {
                    this.currentOrder = i;
                    trackRestart(this.list[i]);
                }
            }
        }, false);


        // 列表开关
        const listBtn = controller.querySelectorAll('a.toggle'),
              play = controller.querySelector('.play-list'),
              effect = controller.querySelector('.effect-list');
        for(let t of listBtn) {
            t.addEventListener('click', function() {
                let list = this.nextSibling.nextSibling;
                if(list.classList.contains('off')) {
                    play.classList.add('off');
                    effect.classList.add('off');
                }
                list.classList.toggle('off');
            }, false);
        }


        // 可视化效果选择
        const ul = controller.querySelector(".effect-list");
        ul.addEventListener('click', (e) => {
            let target = e.target;
            context.restore();
            context.save();
            switch(target.id) {
                case "normal":
                    context.translate(0,0);
                    this.visualiseMode = "normal";
                    break;
                case "circle":
                    context.translate(canvas.width/2, canvas.height/2);
                    this.visualiseMode = "circle";
                    break;
                case "concentric":
                    context.translate(canvas.width/2, canvas.height/2);
                    this.visualiseMode = "concentric";
                    break;
                case "ring":
                    context.translate(canvas.width/2, canvas.height/2);
                    this.visualiseMode = "ring";
                    break;
            }
        }, false);
    }

    loadAudio(file) {
        let fileReader = new FileReader();
        this.audio.volume = this.volume;
        this.playing = true;
        fileReader.readAsArrayBuffer(file);

        fileReader.onload = (e) => {
            let audioContext = this.audioContext;
            this.audio.src = URL.createObjectURL(file);
            this.analyze(audioContext, this.audio);
        };
        /*
        var fileReader = new FileReader();
        var that = this;  // 这里将当前的this也就是Player对象赋值给that，以防下面函数中的this指代的对象改变
        fileReader.onload = function(e) {
            var src = e.target.result,
                audioContext = that.audioContext;  // 如果这里用this则指向fileReader
            audioContext.decodeAudioData(src).then(function(buffer) {
                that.analyze(audioContext, buffer);  // 解码完成后对buffer数据可视化处理，这里使用this会指向window
            });
        };
        fileReader.readAsArrayBuffer(file);
        */
    }

    analyze(audioContext, audio) {
        let audioSource = audioContext.createMediaElementSource(audio),
            analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);

        this.play(audio);
        this.visualise(analyser);
        
        audio.addEventListener('ended', () => {
            this.playing = false;
            cancelAnimationFrame(this.animation);
            this.init();
        }, false);

        /*
        var bufferSource = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;
        bufferSource.connect(analyser);  // 解码后的缓冲数据连接到analyser
        analyser.connect(audioContext.destination);  // 再将analyser连接到扬声器
        bufferSource.buffer = buffer;
        if(this.animation !== null) {
            cancelAnimationFrame(this.animation);  // 停止正在播放的
        }
        bufferSource.start();  // 开始播放
        this.playing = 1;

        this.visualise(analyser);  // 根据分析后的音频频谱信息进行绘图

        var that = this;
        bufferSource.onended = function() {  // 播放结束
            that.playing = 0;
            cancelAnimationFrame(that.animation);  // 结束动画
            that.init();
        };
        */
    }

    visualise(analyser) {
        let dataArray = new Uint8Array(analyser.frequencyBinCount);  // 分析的是二进制数据，所以需要使用Uint8Array类型的数组来存储，常用长度为1024
        
        const render = () => {
            switch(this.visualiseMode) {
                case "normal":
                    this.visualise_normal(analyser, dataArray);
                    break;
                case "circle":
                    this.visualise_circle(analyser, dataArray);
                    break;
                case "concentric":
                    this.visualise_concentric(analyser, dataArray);
                    break;
                case "line":
                    this.visualise_line(analyser);
                    break;
                case "ring":
                    this.visualise_ring(analyser, dataArray);
                    break;
            }
            this.animation = requestAnimationFrame(render);
        }
        this.animation = requestAnimationFrame(render);

    }

    visualise_normal(analyser, dataArray) {
        const width = 5,
              gap = 5;
        let num = canvas.width / (width+gap);

        analyser.getByteFrequencyData(dataArray);  // 分析频谱并将当前的频域数据返回到Uint8Array中
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(255,255,255,0.6)";
        

        let stepAfter = Math.round(200/num),  // 采样步长
            stepBefore = Math.round((dataArray.length*0.8-200)/num);

        for(let i=0; i<num; i++) {
            context.save();
            let valueAfter = dataArray[i*stepAfter];  // 相应频率的幅度值，物理意义为响度
            let valueBefore = dataArray[i*stepBefore+200];
            context.fillRect(i*(width+gap), canvas.height-valueAfter*2, width, valueAfter*2);
            
            context.fillStyle = "rgb(255,255,255)";
            context.fillRect(i*(width+gap), canvas.height-valueBefore, width, valueBefore);
            context.restore();
        }
    }

    visualise_circle(analyser, dataArray) {
        const num = 100,  // 柱条数目
              ang = Math.PI / num;
        let r = this.radius,
            c = 2*Math.PI*r,
            width = c / (num*2+1),
            step = Math.round((dataArray.length*0.8-200)/num);

        analyser.getByteFrequencyData(dataArray);
        context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

        context.fillStyle = "rgba(255,255,255,0.6)";
        for(let i=0; i<(num*2); i++) {
            context.save();
            if(i<num) {
                var value = dataArray[i];
                context.rotate(ang*(i+0.5));
                context.fillRect(-width/4, -r+value/3, width/2, width/2);  // 内环
                context.rotate(-ang*(i+0.5)*2);  // 镜像
                context.fillRect(-width/4, -r+value/3, width/2, width/2);
            }else {
                var value = dataArray[(i-num)*step + 200];
                context.rotate(ang*(i-num+0.5));
                context.fillRect(-width/4, -value/2-r, width/2, value/2+5);  // 外环
                context.rotate(-ang*(i-num+0.5)*2);  // 镜像
                context.fillRect(-width/4, -value/2-r, width/2, value/2+5);
            }
            context.restore();
        }

    }

    visualise_concentric(analyser, dataArray) {
        var num = dataArray.length;
        analyser.getByteFrequencyData(dataArray);
        context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
        for(var i=0; i<num; i++) {
            var value = dataArray[i*20];
            context.beginPath();
            context.arc(0, 0, value, 0, 360, false);
            context.lineWidth = 3;
            context.strokeStyle = "rgba(" + value + ", " + value + ", " + value + ", 0.2)";
            context.stroke();  // 画空心圆
            context.closePath();
        }
    }

    visualise_line(analyser, dataArray) {
        let width = canvas.width*1.0 / 512,
            x = 0,
            y = 0;
        analyser.getByteTimeDomainData(dataArray);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 2;
        context.strokeStyle = "rgb(255,0,0)";
        context.beginPath();
        for(let i=0; i<512; i++) {
            y = dataArray[i];
            if(i===0) {
                context.moveTo(x,y-128);
            }else {
                context.lineTo(x,y-128);
            }
            x += width;
        }
        context.stroke();
    }
 /*   visualise_double: function(analyser, dataArray) {
        analyser.getByteFrequencyData(dataArray);
        context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
        context.fillStyle = "rgba(255,255,255,0.6)";

        var rOuter = canvas.height/3,
            lOuter = 2*Math.PI*rOuter * 0.8,
            angOuter = 2*Math.PI * 0.8 / 100,
            widthOuter = lOuter / 100,

            rInner = canvas.height/4,
            lInner = 2*Math.PI*rInner * 0.8,
            //angInner = 2*Math.PI * 0.8 / 200,
            widthInner = lInner / (200*2-1),
            step = Math.round((dataArray.length*0.8-200)/200);
        for(let i=0; i<200; i++) {
            context.save();
            if(i<100) {
                context.rotate(angOuter*i + 0.1*2*Math.PI);
                var valueOuter = dataArray[i];
                context.fillRect(0, -rOuter-valueOuter/2-5, widthOuter/2, valueOuter/2+5);
                context.fillStyle = "rgb(255,255,255)";
                context.rotate(-angOuter/2 *i);
                var valueInner = dataArray[i*step +200];
                context.fillRect(0, -rInner-valueInner-2, widthInner/2, valueInner+2);
            }else {
                context.fillStyle = "rgb(255,255,255)";
                context.rotate(angOuter/2 *i + 0.2*Math.PI);
                var valueInner = dataArray[i*step +200];
                context.fillRect(0, -rInner-valueInner-2, widthInner/2, valueInner+2);  // 内环
            }
            context.restore();
        }

    }, */

    visualise_ring(analyser, dataArray) {
        analyser.getByteFrequencyData(dataArray);
        context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
        context.fillStyle = "rgba(255,255,255,0.6)";

        let r = this.radius,
            cOut = 2 * Math.PI * r,
            cIn = 2 * Math.PI * (r-100),
            num = 200,
            ang = 2 * Math.PI / num,
            step = Math.round((dataArray.length*0.8 -100) /num),
            widthOut = cOut / num,
            widthIn = cIn / num;

        for(let i=0; i<num; i++) {
            context.save();
            let value = dataArray[i*step +100];
            context.rotate(ang*i);
            context.fillRect(0, -r-5, widthOut/2, value/255*100+5);
            context.fillStyle = "rgb(255,255,255)";
            context.fillRect(0, -r+100 - value/255*100-2, widthIn/2, value/255*100+2);
            context.restore();
        }
    }


    play(audio) {
        const played = document.getElementById('played'),
              total = document.getElementById('total'),
              playedBar = document.querySelector('.played-bar'),
              pause = document.querySelectorAll('a')[2];
        audio.play();
        pause.innerHTML = this.icon.pause;
        const add0 = (num) => num<10 ? `0${num}` : num;
        const format = (num) => {
            let m = Math.floor(num/60),
                s = Math.floor(num - m*60);
            return add0(m) + ":" + add0(s);
        }
        this.time = setInterval(function() {
            played.innerHTML = format(audio.currentTime);
            total.innerHTML = format(audio.duration);
            playedBar.value = audio.currentTime/audio.duration*1000;
        }, 100);
        audio.addEventListener("ended", () => {
            clearInterval(this.time);
            played.innerHTML = "00:00";
            playedBar.value = 0;
        }, false);

    }


}

window.onload = function() {
    var player = new Player();
    player.prepareAPI();
    player.controller();
    window.addEventListener('resize', function() {
        context.restore();
        if(window.innerHeight<600) {
            canvas.width = window.innerWidth;
            canvas.height = 600;
            bg.height = 600;
            player.radius = 200;
            context.save();
            player.visualiseMode==='normal' ? context.translate(0,0) : context.translate(canvas.width/2, window.innerHeight/2);
        }else {
            player.init();
        }
    }, false);
};