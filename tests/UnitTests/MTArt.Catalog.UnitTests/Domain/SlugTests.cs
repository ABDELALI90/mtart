using MTArt.Catalog.Domain.ValueObjects;

namespace MTArt.Catalog.UnitTests.Domain;

public class SlugTests
{
    [Theory]
    [InlineData("zellige-1020")]
    [InlineData("bejmat")]
    [InlineData("a")]
    [InlineData("cement-tiles-10x10")]
    public void Create_WithValidValue_Succeeds(string value)
    {
        var slug = Slug.Create(value);

        slug.Value.Should().Be(value);
    }

    [Theory]
    [InlineData("Zellige-1020")]
    [InlineData("  bejmat  ")]
    public void Create_NormalizesToLowercaseAndTrims(string value)
    {
        var slug = Slug.Create(value);

        slug.Value.Should().Be(value.Trim().ToLowerInvariant());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Invalid Slug")]
    [InlineData("double--hyphen")]
    [InlineData("-leading-hyphen")]
    [InlineData("trailing-hyphen-")]
    [InlineData("special_chars!")]
    public void Create_WithInvalidValue_Throws(string value)
    {
        var act = () => Slug.Create(value);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TryCreate_WithInvalidValue_ReturnsFalse()
    {
        var success = Slug.TryCreate("Not A Slug!", out var slug);

        success.Should().BeFalse();
        slug.Should().BeNull();
    }

    [Fact]
    public void TryCreate_WithValidValue_ReturnsTrue()
    {
        var success = Slug.TryCreate("valid-slug", out var slug);

        success.Should().BeTrue();
        slug!.Value.Should().Be("valid-slug");
    }

    [Fact]
    public void Equality_IsValueBased()
    {
        var a = Slug.Create("zellige-1020");
        var b = Slug.Create("zellige-1020");

        a.Should().Be(b);
        (a == b).Should().BeTrue();
    }

    [Fact]
    public void ImplicitConversion_ToString_ReturnsValue()
    {
        var slug = Slug.Create("zellige-1020");

        string value = slug;

        value.Should().Be("zellige-1020");
    }
}
