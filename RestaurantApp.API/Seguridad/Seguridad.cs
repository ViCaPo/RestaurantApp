using System.Security.Cryptography;

namespace RestaurantApp.API.Seguridad;

/// <summary>
/// Utilidades de seguridad: hash de PIN con PBKDF2 (salt aleatorio por usuario)
/// y generación de tokens de sesión criptográficamente aleatorios. Sin paquetes
/// externos: todo con la BCL.
/// </summary>
public static class Seguridad
{
    private const int Iteraciones = 100_000;
    private const int TamanoSalt = 16;
    private const int TamanoHash = 32;
    private const string Prefijo = "v1";

    /// <summary>Devuelve un hash con formato "v1.{saltBase64}.{hashBase64}".</summary>
    public static string HashearPin(string pin)
    {
        var salt = RandomNumberGenerator.GetBytes(TamanoSalt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(pin, salt, Iteraciones, HashAlgorithmName.SHA256, TamanoHash);
        return $"{Prefijo}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    /// <summary>True si el valor almacenado ya está hasheado (no es texto plano).</summary>
    public static bool EsHash(string almacenado) => almacenado.StartsWith(Prefijo + ".", StringComparison.Ordinal);

    /// <summary>
    /// Verifica el PIN contra el valor almacenado. Soporta valores legados en
    /// texto plano (comparación directa) para permitir la migración suave.
    /// </summary>
    public static bool VerificarPin(string pin, string almacenado)
    {
        if (!EsHash(almacenado))
            return CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(pin),
                System.Text.Encoding.UTF8.GetBytes(almacenado));

        var partes = almacenado.Split('.');
        if (partes.Length != 3) return false;
        try
        {
            var salt = Convert.FromBase64String(partes[1]);
            var esperado = Convert.FromBase64String(partes[2]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(pin, salt, Iteraciones, HashAlgorithmName.SHA256, esperado.Length);
            return CryptographicOperations.FixedTimeEquals(actual, esperado);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    /// <summary>Genera un token de sesión aleatorio (256 bits, base64url).</summary>
    public static string GenerarToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
