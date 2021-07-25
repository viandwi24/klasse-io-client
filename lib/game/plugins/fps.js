export const useFps = ({ fps, screen }) => {
  const ctx = screen.ctx
  ctx.fillStyle = "red";
  ctx.font = "20px Arial"
  ctx.textBaseline = "top"
  ctx.fillText(`fps : ${fps}`, 5, 5)
}
