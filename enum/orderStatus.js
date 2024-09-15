const orderStatus = Object.freeze({
    ONCART: Symbol('on_cart'),
    PENDING: Symbol('pending'),
    SHIPPED: Symbol('shipped'),
    DELIVERED: Symbol('delivered'),
    CANCELLED: Symbol('cancelled')
})