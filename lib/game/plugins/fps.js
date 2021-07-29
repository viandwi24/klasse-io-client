export const useFps = () => {
  return {
    start () {
    },
    update () {
    },
    render ({ fps, screen, ctx }) {
      ctx.fillStyle = "red";
      ctx.font = "20px Arial"
      ctx.textBaseline = "top"
      ctx.fillText(`${fps}`, 5, 5)
    },
    stop () {
    },
  }
}
