window.onload=function(){
    window.requestAnimationFrame(getCurrentTime)
}
function getCurrentTime(){
    window.setTimeout(function(){window.requestAnimationFrame(getCurrentTime)},1000/2)
    var date=new Date()
    var yyyy=date.getFullYear(),mm=date.getMonth(),dd=date.getDate(),day=date.getDay()
    var hh=date.getHours(),MM=date.getMinutes(),ss=date.getSeconds()
    if(hh<10) hh="0"+hh
    if(MM<10) MM="0"+MM
    if(ss<10) ss="0"+ss
    var week=new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat")
    var month=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Nov","Dec")
    var time=week[day]+", "+month[mm]+" "+dd+", "+yyyy+" at "+hh+":"+MM+":"+ss
    var Tools=document.getElementById("CurrentTime")
    Tools.innerHTML=time
}