<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ConfigSetting extends Model
{
    use HasFactory;

    protected $fillable = ['key','value','type'];

    /**
     * Keys that should be encrypted at rest
     */
    private static $encryptedKeys = [
        'trovotech_api_key',
        'trovotech_webhook_secret',
        'oem_telemetry_api_key',
    ];

    /**
     * Accessor: decrypt secrets on retrieval
     */
    protected function value(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (in_array($this->key, self::$encryptedKeys, true) && !empty($value)) {
                    try {
                        return decrypt($value);
                    } catch (\Exception $e) {
                        // If decryption fails, return raw value (backward compatibility)
                        return $value;
                    }
                }
                return $value;
            },
            set: function ($value) {
                if (in_array($this->key, self::$encryptedKeys, true) && !empty($value)) {
                    return encrypt($value);
                }
                return $value;
            }
        );
    }

    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key',$key)->first();
        if (!$setting) return $default;
        return static::castValue($setting->value, $setting->type);
    }

    public static function setValue(string $key, $value, string $type = 'string')
    {
        $stored = $value;
        if ($type === 'json') {
            $stored = json_encode($value);
        } elseif ($type === 'boolean') {
            $stored = $value ? 'true' : 'false';
        }
        return static::updateOrCreate(['key'=>$key],[ 'value'=>$stored, 'type'=>$type ]);
    }

    public static function castValue($value, $type)
    {
        switch ($type) {
            case 'number': return (float)$value;
            case 'boolean': return $value === 'true';
            case 'json': return json_decode($value, true);
            default: return $value;
        }
    }
}
