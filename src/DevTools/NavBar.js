import { Emitter, $, isNum } from '../lib/util'
import evalCss from '../lib/evalCss'

export default class NavBar extends Emitter {
  constructor($el) {
    super()

    this._style = evalCss(require('./NavBar.scss'))

    this._$el = $el.find('.eruda-nav-bar')
    this._$bottomBar = $el.find('.eruda-bottom-bar')
    this._len = 0

    this._bindEvent()
  }
  add(name) {
    const $el = this._$el
    this._len++

    const $last = $el.find('.eruda-nav-bar-item').last()
    const html = `<div class="eruda-nav-bar-item">${name}</div>`
    if ($last.length > 0 && $last.text() === 'settings') {
      $last.before(html)
    } else {
      $el.append(html)
    }
    this.resetBottomBar()
  }
  remove(name) {
    this._len--
    this._$el.find('.eruda-nav-bar-item').each(function() {
      const $this = $(this)
      if ($this.text().toLowerCase() === name.toLowerCase()) $this.remove()
    })
    this.resetBottomBar()
  }
  activateTool(name) {
    const self = this

    this._$el.find('.eruda-nav-bar-item').each(function() {
      const $this = $(this)

      if ($this.text() === name) {
        $this.addClass('eruda-active')
        self.resetBottomBar()
        self._scrollItemToView()
      } else {
        $this.rmClass('eruda-active')
      }
    })
  }
  destroy() {
    evalCss.remove(this._style)
    this._$el.remove()
  }
  _scrollItemToView() {
    const $el = this._$el
    const li = $el.find('.eruda-active').get(0)
    const container = $el.get(0)

    const itemLeft = li.offsetLeft
    const itemWidth = li.offsetWidth
    const containerWidth = container.offsetWidth
    const scrollLeft = container.scrollLeft
    let targetScrollLeft

    if (itemLeft < scrollLeft) {
      targetScrollLeft = itemLeft
    } else if (itemLeft + itemWidth > containerWidth + scrollLeft) {
      targetScrollLeft = itemLeft + itemWidth - containerWidth
    }

    if (!isNum(targetScrollLeft)) return

    container.scrollLeft = targetScrollLeft
  }
  resetBottomBar() {
    const $bottomBar = this._$bottomBar
    const $el = this._$el

    const li = $el.find('.eruda-active').get(0)

    if (!li) return

    $bottomBar.css({
      width: li.offsetWidth,
      left: li.offsetLeft - $el.get(0).scrollLeft
    })
  }
  _bindEvent() {
    const self = this

    this._$el
      .on('click', '.eruda-nav-bar-item', function() {
        self.emit('showTool', $(this).text())
      })
      .on('scroll', () => this.resetBottomBar())
  }
}
