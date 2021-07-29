export default ({ app }, inject) => {
  inject('sleep', ms => new Promise(resolve => setTimeout(resolve, ms)))
}
