export const useFps = () => {
  return {
    start () {
    },
    update () {
    },
    render ({ fps, screen, ctx, timePerFrame }) {
      ctx.fillStyle = "red";
      ctx.font = "20px Arial"
      ctx.textBaseline = "top"
      ctx.alignText = "start"
      ctx.fillText(`FPS : ${fps} | PERFRAME : ${timePerFrame}s`, 5, 5)
    },
    stop () {
    },
  }
}
