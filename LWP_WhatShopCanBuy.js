//=============================================================================
// LWP_WhatShopCanBuy.js
//=============================================================================

/*:
 * @target MV MZ
 * @plugindesc Allows restricting which items can be sold to which shops.
 * @author Logan Pickup
 * 
 * @command buy_only
 * @text Buy only these items
 * @desc Restrict what the next shop screen in this same event can buy from the player.
 *
 * @arg restrictions
 * @type struct<Restrictions>
 * @text What shop can buy
 * 
 * @help
 * 
 * ============================================================================
 * Plugin Commands
 * ============================================================================
 * 
 * RPG Maker MZ:
 * 
 * Choose the "Buy only these items" command and fill in the arguments. Each
 * argument is a list, so multiple of each kind of restriction are permitted.
 * The weapon, armour and item lists use the RPG Maker MZ item selectors, but
 * the weapon type, armour type and equipment type lists do not; you have to
 * remember what number each type is yourself. Notetags are just text; enter
 * each notetag as a separate entry. Any items/weapons/armour with that
 * notetag will be allowed.
 * 
 * RPG Maker MV:
 * 
 * BUY_ONLY a b c ...
 *      The next shop command will create a shop menu that only buys the listed
 *      items. The items to buy are specified as follows:
 *      wX, e.g. w1: buy only weapon 1.
 *      wtX, e.g. wt1: buy only weapon *type* 1.
 *      iX, e.g. i1: buy only item 1.
 *      itX, e.g. it1: buy only item *type* 1. Normal items=1, key items=2.
 *      aX, e.g. a1: buy only armour 1.
 *      atX, e.g. at1: buy only armour *type* 1.
 *      etX, e.g. et1: buy only equipment type 1 (only applies to armour and weapons).
 * 		anything else, e.g. tree: buy only equipment with the notetag <tree>.
 *  
 * This plugin command only works once to affect the next shop menu called from the
 * same script. Multiple BUY_ONLY commands do not stack; only the last one takes effect.
 * 
 * WARNING: Some plugins (e.g. YEP_ItemCore) change the item IDs. This will affect w, i and a
 * types. Please check the plugin's help to find out what the ID you ned to use is. It is
 * advisable to switch to notetags instead if you are using a plugin that changes IDs.
 * 
 * Example:
 * 
 * BUY_ONLY i1 it2 w1 w2 wt3 e5 health poison
 *      The next shop will only purchase from the player:
 *      - items with ID 1 (Potion in default data)
 *      - key items
 *      - weapons with ids 1 and 2 (Sword and Axe in default data)
 *      - weapon type 3 (flail in the default data - there are no weapons of this type in the default data)
 *      - equipment type 5 (accessory in the default data - the Ring qualifies)
 * 		- items with the <health> and/or <poison> notetags in their Note box (none in default data).
 */
/*~struct~Restrictions:
 * @param weaponId
 * @text Specific weapon IDs to allow
 * @type weapon[]
 * 
 * @param wType
 * @text Weapon types to allow
 * @type number[]
 * 
 * @param armourId
 * @text Specific armour IDs to allow
 * @type armor[]
 * 
 * @param aType
 * @text Armour types to allow
 * @type number[]
 * 
 * @param eType
 * @text Equipment types to allow
 * @desc Only works with armour.
 * @type number[]
 * 
 * @param itemId
 * @text Specific item IDs to allow
 * @type item[]
 * 
 * @param meta
 * @text Notetags to allow
 * @desc e.g. add "glorp" to allow all items with "<glorp>" in their notes
 * @type text[]
 */

(function() {

    ///////////////////////////////////////////////////////////////////////////////
    // Window_ShopSell
    // This is the window that contains the player's items (it's a Window_ItemList)
    // and already contains a method letting us check if an item can be sold or not
    ///////////////////////////////////////////////////////////////////////////////

    Window_ShopSell.prototype.setRestrictions = function(restrictions) {
        this._restrictions = restrictions;
        console.log("sell window restrictions", this._restrictions);
    };

    const oldWindow_ShopSellIncludes = Window_ShopSell.prototype.includes;
    Window_ShopSell.prototype.includes = function(item) {
        return oldWindow_ShopSellIncludes.call(this, item) && this.isAllowed(item);
    };

    Window_ShopSell.prototype.isAllowed = function(item) {
        if (this._restrictions && this._restrictions.buy) {
            console.log("checking ", item, this._restrictions);
            if (item.wtypeId) {
                if (this._restrictions.buy.weaponId && this._restrictions.buy.weaponId.indexOf(item.id) !== -1) return true;
                if (this._restrictions.buy.wType && this._restrictions.buy.wType.indexOf(item.wtypeId) !== -1) return true;
                if (this._restrictions.buy.eType && this._restrictions.buy.eType.indexOf(item.etypeId) !== -1) return true;
            }
            if (item.atypeId) {
                if (this._restrictions.buy.armourId && this._restrictions.buy.armourId.indexOf(item.id) !== -1) return true;
                if (this._restrictions.buy.aType && this._restrictions.buy.aType.indexOf(item.atypeId) !== -1) return true;
                if (this._restrictions.buy.eType && this._restrictions.buy.eType.indexOf(item.etypeId) !== -1) return true;
            }
            if (item.itypeId) {
                if (this._restrictions.buy.iType && this._restrictions.buy.iType.indexOf(item.itypeId) !== -1) return true;
				if (this._restrictions.buy.itemId && this._restrictions.buy.itemId.indexOf(item.id) !== -1) return true;
            }
			if (this._restrictions.buy.meta) {
				return this._restrictions.buy.meta.reduce((allowed, tag) => allowed || !!item.meta[tag], false);
			}
			return false;
        } else {
            return true;
        }
    }
    
    const oldWindow_ShopSellIsEnabled = Window_ShopSell.prototype.isEnabled;
    Window_ShopSell.prototype.isEnabled = function(item) {
        return oldWindow_ShopSellIsEnabled.call(this, item) && this.isAllowed(item);
    };
    
    ///////////////////////////////////////////////////////////////////////////////
    // Scene_Shop
    // Just handles passing the data through to Window_ShopSell
    ///////////////////////////////////////////////////////////////////////////////

    const oldScene_ShopPrepare = Scene_Shop.prototype.prepare;
    Scene_Shop.prototype.prepare = function(goods, purchaseOnly, restrictions) {
        oldScene_ShopPrepare.call(this, goods, purchaseOnly);
        this._restrictions = restrictions;
    };

    const oldScene_ShopCreateSellWindow = Scene_Shop.prototype.createSellWindow;
    Scene_Shop.prototype.createSellWindow = function() {
        oldScene_ShopCreateSellWindow.call(this);
        this._sellWindow.setRestrictions(this._restrictions);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Game_Interpreter
    // Performs the plugin command, saves the data until the next shop command, and
    // passes the data (via SceneManager) to Scene_Shop
    ///////////////////////////////////////////////////////////////////////////////

    const oldGame_InterpreterSetup = Game_Interpreter.prototype.setup;
    Game_Interpreter.prototype.setup = function(list, eventId) {
        oldGame_InterpreterSetup.call(this, list, eventId);
        this._nextShopRestrictions = {};
    }

    function filterPrefix(prefix) {
		let regex = new RegExp("^" + prefix + "[0-9]+$");
        return function(x) {
            return regex.test(x);
        }
    }

	function getTypeAndValueForArgument(arg) {
		if (/^i[0-9]+$/.test(arg)) return ['itemId', getId(arg)];
		else if (/^a[0-9]+$/.test(arg)) return ['armourId', getId(arg)];
		else if (/^w[0-9]+$/.test(arg)) return ['weaponId', getId(arg)];
		else if (/^it[0-9]+$/.test(arg)) return ['iType', getId(arg)];
		else if (/^at[0-9]+$/.test(arg)) return ['aType', getId(arg)];
		else if (/^wt[0-9]+$/.test(arg)) return ['wType', getId(arg)];
		else if (/^et[0-9]+$/.test(arg)) return ['eType', getId(arg)];
		else return ['meta', arg.replace(/["<>\s]/g, "")];
	}

	function mapArgumentsToTypes(args) {
		return args.reduce((restrictions, arg) => {
			let [type, value] = getTypeAndValueForArgument(arg);
			restrictions[type] = restrictions[type] || [];
			restrictions[type].push(value);
			return restrictions;
		}, {});
	}

    function getId(x) {
        return Number.parseInt(/[0-9]+/.exec(x)[0]);
    }

    if (typeof(PluginManager.registerCommand) === 'function') {
        // plugin commands for RMMZ
        PluginManager.registerCommand("LWP_WhatShopCanBuy", "buy_only", function(args) {
            console.log(args);
            let restrictions = JSON.parse(args.restrictions);
            this._nextShopRestrictions.buy = {};
            for (const key in restrictions) {
                if (!restrictions[key] || /^\s*$/.test(restrictions[key])) {
                    this._nextShopRestrictions.buy[key] = [];
                } else {
                    this._nextShopRestrictions.buy[key] = JSON.parse(restrictions[key]).map(
                        value => {
                            if (key === 'meta') {
                                return value.replace(/["<>\s]/g, "");
                            } else {
                                return Number.parseInt(value);
                            }
                        }
                    );
                }
            }
            console.log(this._nextShopRestrictions.buy);
        });
    } else {
        // plugin commands for RMMV
        const oldGame_InterpreterPluginCommand = Game_Interpreter.prototype.pluginCommand;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            if (/buy_only/i.test(command)) {
                this._nextShopRestrictions.buy = mapArgumentsToTypes(args);
                return;
            }
            oldGame_InterpreterPluginCommand.call(this, command, args);
        };
    }
    
    const oldGame_InterpreterCommand302 = Game_Interpreter.prototype.command302;
    Game_Interpreter.prototype.command302 = function(params) {
        if (this._nextShopRestrictions.buy) {
            // straight replacement, no fallback - should work with both RMMV and RMMZ,
            // plugin command processing changed slightly but it's not too bad
            params = params || this._params;
            if (!$gameParty.inBattle()) {
                const goods = [params];
                while (this.nextEventCode() === 605) {
                    this._index++;
                    goods.push(this.currentCommand().parameters);
                }
                SceneManager.push(Scene_Shop);
                SceneManager.prepareNextScene(goods, params[4], this._nextShopRestrictions);
                this._nextShopRestrictions = {};
            }
            return true;
        } else {
            // fallback so if something changes original shop creation, it will only
            // break restricted shops, not all shops
            return oldGame_InterpreterCommand302.call(this, params);
        }
    };
    
})();